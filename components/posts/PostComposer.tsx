"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Type, BarChart2, Link as LinkIcon,
  Plus, X, Send, Image, FileText, Loader2, Paperclip, ChevronDown
} from "lucide-react";
import { Button }   from "@/components/ui/Button";
import { Input }    from "@/components/ui/Input";
import { feedApi, type Post, type PostType } from "@/lib/api/feed.api";
import { getErrorMessage }     from "@/lib/api/client";
import { createPostSchema, type CreatePostFormData } from "@/lib/validations/post";
import { useAuthStore }        from "@/lib/store/auth.store";
import { getInitials, getAvatarColor } from "@/lib/utils";
import toast from "react-hot-toast";

type PostComposerProps = {
  communityId?: string;
  channelId?:   string;
  onPostCreated?: (post: Post) => void;
};

var POST_TYPES: { type: PostType; icon: React.ElementType; label: string; desc: string }[] = [
  { type: "text",     icon: Type,       label: "Post",     desc: "Share a thought"   },
  { type: "poll",     icon: BarChart2,  label: "Poll",     desc: "Gather opinions"   },
  { type: "resource", icon: LinkIcon,   label: "Resource", desc: "Share a link"      },
  { type: "file",     icon: FileText,   label: "File",     desc: "Upload a document" }
];

var ALLOWED_IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif"];
var ALLOWED_FILE_TYPES  = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain","application/zip"];
var MAX_IMAGE_SIZE = 10 * 1024 * 1024;
var MAX_FILE_SIZE  = 25 * 1024 * 1024;

export function PostComposer({ communityId, channelId, onPostCreated }: PostComposerProps) {
  var { user }       = useAuthStore();
  var imageInputRef  = useRef<HTMLInputElement>(null);
  var fileInputRef   = useRef<HTMLInputElement>(null);
  var textareaRef    = useRef<HTMLTextAreaElement>(null);

  var [expanded,     setExpanded]     = useState(false);
  var [postType,     setPostType]     = useState<PostType>("text");
  var [pollOptions,  setPollOptions]  = useState(["", ""]);
  var [tagInput,     setTagInput]     = useState("");
  var [tags,         setTags]         = useState<string[]>([]);
  var [mediaFiles,   setMediaFiles]   = useState<{ file: File; preview: string; uploading: boolean; url: string }[]>([]);
  var [attachedFile, setAttachedFile] = useState<{ file: File; uploading: boolean; url: string; name: string; size: number } | null>(null);

  var { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<CreatePostFormData>({ resolver: zodResolver(createPostSchema), defaultValues: { type: "text", content: "" } });

  var content = watch("content", "");

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    var files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 4) { toast.error("Maximum 4 images per post"); return; }
    for (var file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error("Only JPG, PNG, WebP, GIF allowed"); continue; }
      if (file.size > MAX_IMAGE_SIZE) { toast.error(file.name + " exceeds 10MB"); continue; }
      var preview = URL.createObjectURL(file);
      var entry   = { file, preview, uploading: true, url: "" };
      setMediaFiles(function(prev) { return [...prev, entry]; });
      try {
        var res = await feedApi.uploadPostMedia(file);
        setMediaFiles(function(prev) {
          return prev.map(function(m) { return m.preview === preview ? Object.assign({}, m, { uploading: false, url: res.data.data.url }) : m; });
        });
      } catch {
        toast.error("Failed to upload " + file.name);
        setMediaFiles(function(prev) { return prev.filter(function(m) { return m.preview !== preview; }); });
      }
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) { toast.error("Unsupported file type"); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error("File exceeds 25MB"); return; }
    setAttachedFile({ file, uploading: true, url: "", name: file.name, size: file.size });
    try {
      var res = await feedApi.uploadPostMedia(file);
      setAttachedFile(function(prev) { return prev ? Object.assign({}, prev, { uploading: false, url: res.data.data.url }) : null; });
    } catch { toast.error("Failed to upload file"); setAttachedFile(null); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(preview: string) { setMediaFiles(function(prev) { return prev.filter(function(m) { return m.preview !== preview; }); }); }
  function addPollOption() { if (pollOptions.length >= 6) return; setPollOptions(function(prev) { return [...prev, ""]; }); }
  function updatePollOption(i: number, v: string) { setPollOptions(function(prev) { var n = [...prev]; n[i] = v; return n; }); }
  function removePollOption(i: number) { if (pollOptions.length <= 2) return; setPollOptions(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); }
  function addTag() {
    var t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.length >= 5 || tags.includes(t)) { setTagInput(""); return; }
    setTags(function(prev) { return [...prev, t]; });
    setTagInput("");
  }
  function removeTag(tag: string) { setTags(function(prev) { return prev.filter(function(t) { return t !== tag; }); }); }
  function handleCancel() { setExpanded(false); reset(); setTags([]); setMediaFiles([]); setAttachedFile(null); setPollOptions(["",""]); }

  async function onSubmit(data: CreatePostFormData) {
    if (mediaFiles.some(function(m) { return m.uploading; }) || (attachedFile && attachedFile.uploading)) {
      toast.error("Please wait for uploads to complete"); return;
    }
    var mediaURLs = mediaFiles.map(function(m) { return m.url; }).filter(Boolean);
    var payload = {
      type: postType, content: data.content,
      title: data.title || undefined, tags: tags.length > 0 ? tags : undefined,
      communityId: communityId || undefined, channelId: channelId || undefined,
      mediaURLs: mediaURLs.length > 0 ? mediaURLs : undefined,
      pollOptions: postType === "poll" ? pollOptions.filter(function(o) { return o.trim().length > 0; }) : undefined,
      resourceUrl: postType === "resource" && data.resourceUrl ? data.resourceUrl : undefined,
      resourceTitle: postType === "resource" && data.resourceTitle ? data.resourceTitle : undefined,
      fileUrl: postType === "file" && attachedFile ? attachedFile.url : undefined,
      fileName: postType === "file" && attachedFile ? attachedFile.name : undefined,
      fileSize: postType === "file" && attachedFile ? attachedFile.size : undefined
    };
    try {
      var res = await feedApi.createPost(payload as Parameters<typeof feedApi.createPost>[0]);
      toast.success("Post published!");
      if (onPostCreated) onPostCreated(res.data.data);
      handleCancel();
    } catch(err) { toast.error(getErrorMessage(err)); }
  }

  if (!user) return null;
  var initials = getInitials(user.name);
  var avatarBg = getAvatarColor(user.name);
  var currentType = POST_TYPES.find(function(p) { return p.type === postType; }) || POST_TYPES[0];

  /* ── Collapsed state ─────────────────────────────────────── */
  if (!expanded) {
    return (
      <div className="bg-white border border-surface-200 rounded-2xl p-4 hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/5 transition-all duration-200 cursor-text"
        onClick={function() { setExpanded(true); setTimeout(function() { if (textareaRef.current) textareaRef.current.focus(); }, 50); }}>
        <div className="flex items-center gap-3">
          <div className={"w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 " + avatarBg}>
            {initials}
          </div>
          <div className="flex-1 px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-400 select-none">
            Share something with the community...
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-1.5">
            {POST_TYPES.map(function(pt) {
              return (
                <div key={pt.type} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-100 text-surface-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                  <pt.icon size={14} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ── Expanded state ──────────────────────────────────────── */
  return (
    <div className="bg-white border border-brand-200 rounded-2xl shadow-lg shadow-brand-500/5 overflow-hidden">

      {/* Type selector header */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-0">
        {POST_TYPES.map(function(pt) {
          var active = postType === pt.type;
          return (
            <button key={pt.type} type="button" onClick={function() { setPostType(pt.type); }}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface-100 text-surface-500 hover:bg-surface-200 hover:text-surface-700"
              ].join(" ")}>
              <pt.icon size={12} />
              <span className="hidden sm:inline">{pt.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-4 space-y-3">

        {/* Author + title row */}
        <div className="flex items-center gap-3">
          <div className={"w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 " + avatarBg}>
            {initials}
          </div>
          <div className="flex-1">
            <Input placeholder="Title (optional)" error={errors.title?.message} {...register("title")} />
          </div>
        </div>

        {/* Content textarea */}
        <div>
          <textarea
            {...register("content")}
            ref={function(el) {
              (register("content") as { ref: (el: HTMLTextAreaElement | null) => void }).ref(el);
              (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
            }}
            placeholder={
              postType === "poll"     ? "Describe what you are asking about..." :
              postType === "resource" ? "Why are you sharing this resource?" :
              postType === "file"     ? "Describe this file..." :
              "What is on your mind? Share a thought, question, or update..."
            }
            rows={4}
            className="input resize-none w-full"
            onChange={function(e) { autoResize(e.target); }}
          />
          {errors.content && <p className="field-error">{errors.content.message}</p>}
        </div>

        {/* Image upload (text posts) */}
        {postType === "text" && (
          <div>
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {mediaFiles.map(function(m) {
                  return (
                    <div key={m.preview} className="relative w-20 h-20 rounded-xl overflow-hidden border border-surface-200">
                      <img src={m.preview} alt="Preview" className="w-full h-full object-cover" />
                      {m.uploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 size={16} className="animate-spin text-white" />
                        </div>
                      ) : (
                        <button type="button" onClick={function() { removeMedia(m.preview); }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {mediaFiles.length < 4 && (
              <button type="button" onClick={function() { if (imageInputRef.current) imageInputRef.current.click(); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-surface-500 hover:text-brand-600 hover:bg-brand-50 transition-all border border-dashed border-surface-300 hover:border-brand-300">
                <Image size={13} />Add image
              </button>
            )}
            <input ref={imageInputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} multiple onChange={handleImageSelect} className="hidden" />
          </div>
        )}

        {/* File upload */}
        {postType === "file" && (
          <div>
            {attachedFile ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200">
                {attachedFile.uploading
                  ? <Loader2 size={16} className="animate-spin text-brand-500 shrink-0" />
                  : <FileText size={16} className="text-brand-500 shrink-0" />
                }
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-surface-900 truncate">{attachedFile.name}</p>
                  <p className="text-xs text-surface-400">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                {!attachedFile.uploading && (
                  <button type="button" onClick={function() { setAttachedFile(null); }}
                    className="text-surface-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <button type="button" onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }}
                className="flex items-center gap-2.5 w-full px-4 py-4 rounded-xl border-2 border-dashed border-surface-300 hover:border-brand-400 hover:bg-brand-50 transition-all text-sm font-medium text-surface-400 hover:text-brand-600 justify-center">
                <Paperclip size={15} />Attach a file (PDF, DOC, TXT, ZIP — max 25MB)
              </button>
            )}
            <input ref={fileInputRef} type="file" accept={ALLOWED_FILE_TYPES.join(",")} onChange={handleFileSelect} className="hidden" />
          </div>
        )}

        {/* Poll options */}
        {postType === "poll" && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest">Poll options</p>
            {pollOptions.map(function(option, i) {
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center text-[10px] font-black text-surface-400 shrink-0">
                    {i + 1}
                  </div>
                  <input value={option}
                    onChange={function(e: React.ChangeEvent<HTMLInputElement>) { updatePollOption(i, e.target.value); }}
                    placeholder={"Option " + (i + 1)} className="input flex-1" maxLength={100} />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={function() { removePollOption(i); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors shrink-0">
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}
            {pollOptions.length < 6 && (
              <button type="button" onClick={addPollOption}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors mt-1">
                <Plus size={12} />Add option
              </button>
            )}
          </div>
        )}

        {/* Resource fields */}
        {postType === "resource" && (
          <div className="space-y-2.5">
            <Input placeholder="Resource title" error={errors.resourceTitle?.message} {...register("resourceTitle")} />
            <Input type="url" placeholder="https://..." leftIcon={<LinkIcon size={13} />}
              error={errors.resourceUrl?.message} {...register("resourceUrl")} />
          </div>
        )}

        {/* Tags */}
        <div>
          <div className="flex gap-2">
            <input value={tagInput}
              onChange={function(e: React.ChangeEvent<HTMLInputElement>) { setTagInput(e.target.value); }}
              onKeyDown={function(e: React.KeyboardEvent) { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add tags (max 5)"
              className="input flex-1 text-xs" maxLength={30} />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(function(tag) {
                return (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>
                    #{tag}
                    <button type="button" onClick={function() { removeTag(tag); }}
                      className="ml-0.5 hover:text-red-500 transition-colors">
                      <X size={9} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-100">
          <button type="button" onClick={handleCancel}
            className="text-sm text-surface-400 hover:text-surface-600 transition-colors font-semibold px-2 py-1 rounded-lg hover:bg-surface-100">
            Cancel
          </button>
          <Button type="submit" loading={isSubmitting}
            disabled={content.trim().length === 0}
            leftIcon={<Send size={13} />}>
            Publish post
          </Button>
        </div>
      </form>
    </div>
  );
}