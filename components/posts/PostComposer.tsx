"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Type, BarChart2, Link as LinkIcon,
  Plus, X, Send, Image, FileText, Loader2, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { feedApi, type Post, type PostType } from "@/lib/api/feed.api";
import { getErrorMessage } from "@/lib/api/client";
import { createPostSchema, type CreatePostFormData } from "@/lib/validations/post";
import { useAuthStore } from "@/lib/store/auth.store";
import { getInitials, getAvatarColor } from "@/lib/utils";
import toast from "react-hot-toast";

type PostComposerProps = {
  communityId?: string;
  channelId?: string;
  onPostCreated?: (post: Post) => void;
};

var POST_TYPES: { type: PostType; icon: React.ReactNode; label: string }[] = [
  { type: "text",     icon: React.createElement(Type,      { size: 13 }), label: "Post"     },
  { type: "poll",     icon: React.createElement(BarChart2, { size: 13 }), label: "Poll"     },
  { type: "resource", icon: React.createElement(LinkIcon,  { size: 13 }), label: "Resource" },
  { type: "file",     icon: React.createElement(FileText,  { size: 13 }), label: "File"     }
];

var ALLOWED_IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif"];
var ALLOWED_FILE_TYPES  = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain","application/zip"];
var MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
var MAX_FILE_SIZE  = 25 * 1024 * 1024; // 25MB

export function PostComposer({ communityId, channelId, onPostCreated }: PostComposerProps) {
  var { user } = useAuthStore();
  var imageInputRef = useRef<HTMLInputElement>(null);
  var fileInputRef  = useRef<HTMLInputElement>(null);

  var [expanded, setExpanded]     = useState(false);
  var [postType, setPostType]     = useState<PostType>("text");
  var [pollOptions, setPollOptions] = useState(["", ""]);
  var [tagInput, setTagInput]     = useState("");
  var [tags, setTags]             = useState<string[]>([]);
  var [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; uploading: boolean; url: string }[]>([]);
  var [attachedFile, setAttachedFile] = useState<{ file: File; uploading: boolean; url: string; name: string; size: number } | null>(null);

  var { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<CreatePostFormData>({
      resolver: zodResolver(createPostSchema),
      defaultValues: { type: "text", content: "" }
    });

  var content = watch("content", "");

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    var files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 4) { toast.error("Maximum 4 images per post"); return; }

    for (var file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { toast.error("Only JPG, PNG, WebP, GIF allowed"); continue; }
      if (file.size > MAX_IMAGE_SIZE) { toast.error(file.name + " exceeds 10MB limit"); continue; }

      var preview = URL.createObjectURL(file);
      var entry = { file, preview, uploading: true, url: "" };
      setMediaFiles(function(prev) { return [...prev, entry]; });

      try {
        var res = await feedApi.uploadPostMedia(file);
        setMediaFiles(function(prev) {
          return prev.map(function(m) {
            return m.preview === preview ? Object.assign({}, m, { uploading: false, url: res.data.data.url }) : m;
          });
        });
      } catch(err) {
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
    if (file.size > MAX_FILE_SIZE) { toast.error("File exceeds 25MB limit"); return; }

    setAttachedFile({ file, uploading: true, url: "", name: file.name, size: file.size });
    try {
      var res = await feedApi.uploadPostMedia(file);
      setAttachedFile(function(prev) { return prev ? Object.assign({}, prev, { uploading: false, url: res.data.data.url }) : null; });
    } catch(err) {
      toast.error("Failed to upload file");
      setAttachedFile(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(preview: string) {
    setMediaFiles(function(prev) { return prev.filter(function(m) { return m.preview !== preview; }); });
  }

  function addPollOption() {
    if (pollOptions.length >= 6) return;
    setPollOptions(function(prev) { return [...prev, ""]; });
  }

  function updatePollOption(index: number, value: string) {
    setPollOptions(function(prev) { var next = [...prev]; next[index] = value; return next; });
  }

  function removePollOption(index: number) {
    if (pollOptions.length <= 2) return;
    setPollOptions(function(prev) { return prev.filter(function(_, i) { return i !== index; }); });
  }

  function addTag() {
    var trimmed = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed || tags.length >= 5 || tags.includes(trimmed)) { setTagInput(""); return; }
    setTags(function(prev) { return [...prev, trimmed]; });
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(function(prev) { return prev.filter(function(t) { return t !== tag; }); });
  }

  async function onSubmit(data: CreatePostFormData) {
    var uploadingImages = mediaFiles.some(function(m) { return m.uploading; });
    var uploadingFile   = attachedFile && attachedFile.uploading;
    if (uploadingImages || uploadingFile) { toast.error("Please wait for uploads to complete"); return; }

    var mediaURLs = mediaFiles.map(function(m) { return m.url; }).filter(Boolean);

    var payload = {
      type: postType,
      content: data.content,
      title: data.title || undefined,
      tags: tags.length > 0 ? tags : undefined,
      communityId: communityId || undefined,
      channelId: channelId || undefined,
      mediaURLs: mediaURLs.length > 0 ? mediaURLs : undefined,
      pollOptions: postType === "poll"
        ? pollOptions.filter(function(o) { return o.trim().length > 0; })
        : undefined,
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
      reset();
      setTags([]);
      setPollOptions(["", ""]);
      setTagInput("");
      setMediaFiles([]);
      setAttachedFile(null);
      setExpanded(false);
    } catch(err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (!user) return null;

  var initials = getInitials(user.name);
  var avatarBg = getAvatarColor(user.name);

  if (!expanded) {
    return React.createElement(
      "div",
      { className: "card p-4 flex items-center gap-3 cursor-pointer hover:border-brand-300 transition-all duration-150", onClick: function() { setExpanded(true); } },
      React.createElement("div", { className: "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 " + avatarBg }, initials),
      React.createElement("div", { className: "flex-1 px-3.5 py-2 rounded-xl bg-surface-50 border border-surface-200 text-sm text-surface-400" }, "Share something with the community...")
    );
  }

  return React.createElement(
    "div",
    { className: "card p-5" },

    /* Type selector */
    React.createElement(
      "div",
      { className: "flex items-center gap-1 mb-4 flex-wrap" },
      POST_TYPES.map(function(pt) {
        return React.createElement(
          "button",
          { key: pt.type, type: "button", onClick: function() { setPostType(pt.type); },
            className: ["flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
              postType === pt.type ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"
            ].join(" ")
          },
          pt.icon, pt.label
        );
      })
    ),

    React.createElement(
      "form",
      { onSubmit: handleSubmit(onSubmit), noValidate: true, className: "space-y-3" },

      React.createElement(Input, { placeholder: "Title (optional)", error: errors.title?.message, ...register("title") }),

      React.createElement(
        "div",
        null,
        React.createElement("textarea", {
          ...register("content"),
          placeholder: postType === "poll" ? "Describe your poll..." : postType === "resource" ? "Why are you sharing this?" : postType === "file" ? "Describe this file..." : "What is on your mind?",
          rows: 4,
          className: "input resize-none",
          style: { height: "auto" }
        }),
        errors.content && React.createElement("p", { className: "field-error" }, errors.content.message)
      ),

      /* Image upload — for text posts */
      postType === "text" && React.createElement(
        "div",
        null,
        mediaFiles.length > 0 && React.createElement(
          "div",
          { className: "flex gap-2 flex-wrap mb-2" },
          mediaFiles.map(function(m) {
            return React.createElement(
              "div",
              { key: m.preview, className: "relative w-20 h-20" },
              React.createElement("img", { src: m.preview, alt: "Preview", className: "w-20 h-20 object-cover rounded-xl border border-surface-200" }),
              m.uploading && React.createElement("div", { className: "absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl" },
                React.createElement(Loader2, { size: 16, className: "animate-spin text-white" })
              ),
              !m.uploading && React.createElement(
                "button",
                { type: "button", onClick: function() { removeMedia(m.preview); }, className: "absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center" },
                React.createElement(X, { size: 10 })
              )
            );
          })
        ),
        mediaFiles.length < 4 && React.createElement(
          "button",
          { type: "button", onClick: function() { if (imageInputRef.current) imageInputRef.current.click(); }, className: "flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-brand-600 transition-colors" },
          React.createElement(Image, { size: 13 }),
          "Add image"
        ),
        React.createElement("input", { ref: imageInputRef, type: "file", accept: ALLOWED_IMAGE_TYPES.join(","), multiple: true, onChange: handleImageSelect, className: "hidden" })
      ),

      /* File upload — for file posts */
      postType === "file" && React.createElement(
        "div",
        null,
        attachedFile ? (
          React.createElement(
            "div",
            { className: "flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200" },
            attachedFile.uploading
              ? React.createElement(Loader2, { size: 15, className: "animate-spin text-brand-500 shrink-0" })
              : React.createElement(FileText, { size: 15, className: "text-brand-500 shrink-0" }),
            React.createElement("div", { className: "min-w-0 flex-1" },
              React.createElement("p", { className: "text-sm font-medium text-surface-900 truncate" }, attachedFile.name),
              React.createElement("p", { className: "text-xs text-surface-400" }, (attachedFile.size / 1024).toFixed(1) + " KB")
            ),
            !attachedFile.uploading && React.createElement(
              "button",
              { type: "button", onClick: function() { setAttachedFile(null); }, className: "text-surface-400 hover:text-danger-500 transition-colors" },
              React.createElement(X, { size: 14 })
            )
          )
        ) : (
          React.createElement(
            "button",
            { type: "button", onClick: function() { if (fileInputRef.current) fileInputRef.current.click(); }, className: "flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 hover:border-brand-400 hover:bg-brand-50 transition-all text-sm font-medium text-surface-500 hover:text-brand-600" },
            React.createElement(Paperclip, { size: 15 }),
            "Attach a file (PDF, DOC, TXT, ZIP — max 25MB)"
          )
        ),
        React.createElement("input", { ref: fileInputRef, type: "file", accept: ALLOWED_FILE_TYPES.join(","), onChange: handleFileSelect, className: "hidden" })
      ),

      /* Poll options */
      postType === "poll" && React.createElement(
        "div",
        { className: "space-y-2" },
        React.createElement("p", { className: "text-xs font-semibold text-surface-600" }, "Poll options"),
        pollOptions.map(function(option, i) {
          return React.createElement(
            "div",
            { key: i, className: "flex items-center gap-2" },
            React.createElement("input", { value: option, onChange: function(e: React.ChangeEvent<HTMLInputElement>) { updatePollOption(i, e.target.value); }, placeholder: "Option " + (i + 1), className: "input flex-1", maxLength: 100 }),
            pollOptions.length > 2 && React.createElement(
              "button",
              { type: "button", onClick: function() { removePollOption(i); }, className: "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger-50 text-surface-400 hover:text-danger-500 transition-colors shrink-0" },
              React.createElement(X, { size: 14 })
            )
          );
        }),
        pollOptions.length < 6 && React.createElement(
          "button",
          { type: "button", onClick: addPollOption, className: "flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mt-1" },
          React.createElement(Plus, { size: 12 }), "Add option"
        )
      ),

      /* Resource fields */
      postType === "resource" && React.createElement(
        "div",
        { className: "space-y-2" },
        React.createElement(Input, { placeholder: "Resource title", error: errors.resourceTitle?.message, ...register("resourceTitle") }),
        React.createElement(Input, { type: "url", placeholder: "https://...", leftIcon: React.createElement(LinkIcon, { size: 13 }), error: errors.resourceUrl?.message, ...register("resourceUrl") })
      ),

      /* Tags */
      React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "flex gap-2" },
          React.createElement("input", { value: tagInput, onChange: function(e: React.ChangeEvent<HTMLInputElement>) { setTagInput(e.target.value); }, onKeyDown: function(e: React.KeyboardEvent) { if (e.key === "Enter") { e.preventDefault(); addTag(); } }, placeholder: "Add tags (max 5)", className: "input flex-1 text-xs", maxLength: 30 }),
          React.createElement(Button, { type: "button", variant: "secondary", size: "sm", onClick: addTag }, "Add")
        ),
        tags.length > 0 && React.createElement(
          "div",
          { className: "flex flex-wrap gap-1.5 mt-2" },
          tags.map(function(tag) {
            return React.createElement("span", { key: tag, className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200" },
              "#" + tag,
              React.createElement("button", { type: "button", onClick: function() { removeTag(tag); }, className: "text-brand-400 hover:text-brand-700 ml-0.5" }, React.createElement(X, { size: 9 }))
            );
          })
        )
      ),

      /* Actions */
      React.createElement(
        "div",
        { className: "flex items-center justify-between pt-1" },
        React.createElement("button", { type: "button", onClick: function() { setExpanded(false); reset(); setTags([]); setMediaFiles([]); setAttachedFile(null); }, className: "text-sm text-surface-400 hover:text-surface-600 transition-colors font-medium" }, "Cancel"),
        React.createElement(Button, { type: "submit", loading: isSubmitting, disabled: content.trim().length === 0, leftIcon: React.createElement(Send, { size: 13 }) }, "Publish")
      )
    )
  );
}
