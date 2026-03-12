"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Video, MapPin, Users, Lock, Unlock,
  Tag, ArrowLeft, Calendar, Globe
} from "lucide-react";
import Link from "next/link";
import { eventsApi, type EventType } from "@/lib/api/events.api";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

var EVENT_TYPES: { id: EventType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "webinar", label: "Webinar",  description: "Online presentation or talk",   icon: React.createElement(Video,    { size: 18 }) },
  { id: "meetup",  label: "Meetup",   description: "In-person gathering",            icon: React.createElement(MapPin,   { size: 18 }) },
  { id: "room",    label: "Room",     description: "Open discussion or AMA",         icon: React.createElement(Globe,    { size: 18 }) }
];

export default function CreateEventPage() {
  var router = useRouter();

  var [type,        setType]        = useState<EventType>("webinar");
  var [title,       setTitle]       = useState("");
  var [details,     setDetails]     = useState("");
  var [startDate,   setStartDate]   = useState("");
  var [endDate,     setEndDate]     = useState("");
  var [location,    setLocation]    = useState("");
  var [meetingUrl,  setMeetingUrl]  = useState("");
  var [maxAttendees,setMaxAttendees]= useState("");
  var [isPrivate,   setIsPrivate]   = useState(false);
  var [tagInput,    setTagInput]    = useState("");
  var [tags,        setTags]        = useState<string[]>([]);
  var [saving,      setSaving]      = useState(false);

  /* Validation */
  var titleError      = title.trim().length === 0 ? "" : title.trim().length < 3 ? "At least 3 characters" : title.trim().length > 200 ? "Max 200 characters" : "";
  var detailsError    = details.trim().length > 5000 ? "Max 5000 characters" : "";
  var startDateError  = startDate && endDate && new Date(startDate) >= new Date(endDate) ? "Start must be before end" : "";
  var canSubmit       = title.trim().length >= 3 && details.trim().length > 0 && startDate && endDate && !startDateError;

  function addTag() {
    var t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.length >= 5 || tags.includes(t)) { setTagInput(""); return; }
    setTags(function(prev) { return [...prev, t]; });
    setTagInput("");
  }

  async function handleSubmit() {
    if (!canSubmit) { toast.error("Please fill in all required fields"); return; }
    setSaving(true);
    try {
      var max = maxAttendees ? parseInt(maxAttendees, 10) : undefined;
      var payload = {
        type:         type,
        title:        title.trim(),
        details:      details.trim(),
        startDate:    new Date(startDate).toISOString(),
        endDate:      new Date(endDate).toISOString(),
        location:     type === "meetup" && location.trim() ? location.trim() : undefined,
        meetingUrl:   type !== "meetup" && meetingUrl.trim() ? meetingUrl.trim() : undefined,
        maxAttendees: max && !isNaN(max) && max > 0 ? max : undefined,
        isPrivate:    isPrivate,
        tags:         tags.length > 0 ? tags : undefined
      };
      var res = await eventsApi.createEvent(payload);
      toast.success("Event created!");
      router.push("/events/" + res.data.data._id);
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-700 transition-colors font-medium mb-7">
        <ArrowLeft size={14} />Back to events
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <Calendar size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Create an event</h1>
          <p className="text-sm text-surface-500">Bring the community together.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Event type */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-surface-900 mb-3">Event type</h2>
          <div className="grid grid-cols-3 gap-3">
            {EVENT_TYPES.map(function(et) {
              var selected = type === et.id;
              return (
                <button key={et.id} type="button" onClick={function() { setType(et.id); }}
                  className={["flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150",
                    selected ? "border-brand-500 bg-brand-50" : "border-surface-200 hover:border-brand-300 bg-white"
                  ].join(" ")}>
                  <span className={selected ? "text-brand-600" : "text-surface-400"}>{et.icon}</span>
                  <div className="text-center">
                    <p className={"text-xs font-bold " + (selected ? "text-brand-700" : "text-surface-700")}>{et.label}</p>
                    <p className="text-xs text-surface-400 mt-0.5 hidden sm:block">{et.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-surface-900">Details</h2>
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input value={title} onChange={function(e) { setTitle(e.target.value); }}
              placeholder="Give your event a clear, descriptive title" maxLength={200}
              className={"input w-full " + (titleError ? "input-error" : "")} />
            {titleError && <p className="field-error">{titleError}</p>}
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea value={details} onChange={function(e) { setDetails(e.target.value); }}
              placeholder="Tell attendees what to expect, who it is for, and what they need to prepare..."
              rows={5} maxLength={5000}
              className={"input resize-none w-full " + (detailsError ? "input-error" : "")} />
            <div className="flex justify-between mt-1">
              {detailsError ? <p className="field-error">{detailsError}</p> : <span />}
              <span className="text-xs text-surface-400">{details.length}/5000</span>
            </div>
          </div>
        </div>

        {/* Date and time */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-surface-900">Date and time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={startDate} onChange={function(e) { setStartDate(e.target.value); }}
                className={"input w-full " + (startDateError ? "input-error" : "")} />
            </div>
            <div>
              <label className="label">End <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={endDate} onChange={function(e) { setEndDate(e.target.value); }}
                className={"input w-full " + (startDateError ? "input-error" : "")} />
            </div>
          </div>
          {startDateError && <p className="field-error">{startDateError}</p>}
        </div>

        {/* Location / Meeting URL */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-surface-900 mb-3">
            {type === "meetup" ? "Location" : "Meeting link"}
          </h2>
          {type === "meetup" ? (
            <Input leftIcon={React.createElement(MapPin, { size: 14 })} value={location}
              onChange={function(e) { setLocation(e.target.value); }}
              placeholder="Venue name, address or coordinates" />
          ) : (
            <Input type="url" leftIcon={React.createElement(Globe, { size: 14 })} value={meetingUrl}
              onChange={function(e) { setMeetingUrl(e.target.value); }}
              placeholder="https://meet.google.com/... or Zoom link" />
          )}
        </div>

        {/* Capacity + Privacy */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-surface-900">Settings</h2>
          <div>
            <label className="label">Max attendees <span className="text-surface-400 font-normal">(optional)</span></label>
            <Input type="number" leftIcon={React.createElement(Users, { size: 14 })} value={maxAttendees}
              onChange={function(e) { setMaxAttendees(e.target.value); }}
              placeholder="Leave blank for unlimited" min="1" max="10000" />
          </div>

          {/* Private toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-surface-900">Private event</p>
              <p className="text-xs text-surface-500 mt-0.5">Only visible to community members</p>
            </div>
            <button type="button" onClick={function() { setIsPrivate(function(v) { return !v; }); }}
              className={["relative w-11 h-6 rounded-full transition-colors duration-200",
                isPrivate ? "bg-brand-600" : "bg-surface-200"
              ].join(" ")}>
              <span className={["absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                isPrivate ? "translate-x-5" : "translate-x-0.5"
              ].join(" ")} />
              <span className="sr-only">{isPrivate ? "Private" : "Public"}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-surface-900 mb-3">Tags <span className="text-surface-400 font-normal text-xs">({tags.length}/5)</span></h2>
          <div className="flex gap-2 mb-3">
            <Input leftIcon={React.createElement(Tag, { size: 14 })} value={tagInput}
              onChange={function(e) { setTagInput(e.target.value); }}
              onKeyDown={function(e: React.KeyboardEvent) { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Add a tag and press Enter" />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(function(tag) {
                return (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    #{tag}
                    <button type="button" onClick={function() { setTags(function(p) { return p.filter(function(t) { return t !== tag; }); }); }}
                      className="text-brand-400 hover:text-brand-700 ml-0.5">&times;</button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/events">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button onClick={handleSubmit} loading={saving} disabled={!canSubmit}
            leftIcon={React.createElement(Calendar, { size: 15 })}>
            {saving ? "Creating..." : "Create event"}
          </Button>
        </div>
      </div>
    </div>
  );
}