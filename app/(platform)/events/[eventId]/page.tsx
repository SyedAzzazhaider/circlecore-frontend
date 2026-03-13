"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, MapPin, Video, Users, Bell, BellOff,
  ExternalLink, Loader2, Download, Clock, CheckCircle2, Tag
} from "lucide-react";
import { eventsApi, type CCEvent } from "@/lib/api/events.api";
import { EventBadge } from "@/components/events/EventBadge";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/utils";
import { isEventPast, isEventLive, isEventFull, getCapacityPercent, getCapacityBarColor, getSpotsRemaining } from "@/lib/utils/events";
import { generateGoogleCalendarUrl, downloadICal } from "@/lib/utils/calendar";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";
import toast from "react-hot-toast";

var TYPE_GRADIENTS: Record<string, string> = {
  webinar: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
  meetup:  "linear-gradient(135deg, #d1fae5 0%, #dbeafe 100%)",
  room:    "linear-gradient(135deg, #fdf4ff 0%, #ede9fe 100%)"
};
var TYPE_EMOJIS: Record<string, string> = { webinar: "🎙️", meetup: "🤝", room: "💬" };

export default function EventDetailPage() {
  var params  = useParams();
  var router  = useRouter();
  var eventId = params.eventId as string;

  var [event,       setEvent]       = useState<CCEvent | null>(null);
  var [loading,     setLoading]     = useState(true);
  var [error,       setError]       = useState("");
  var [rsvping,     setRsvping]     = useState(false);
  var [reminding,   setReminding]   = useState(false);
  var [hasRsvped,   setHasRsvped]   = useState(false);
  var [rsvpCount,   setRsvpCount]   = useState(0);
  var [reminderSet, setReminderSet] = useState(false);

  useEffect(function() {
    if (!eventId) return;
    setLoading(true);
    eventsApi.getEvent(eventId)
      .then(function(res) {
        var e = res.data.data;
        setEvent(e); setHasRsvped(e.hasRsvped); setRsvpCount(e.rsvpCount); setReminderSet(e.reminderSet);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, [eventId]);

  async function handleRsvp() {
    if (!event || rsvping || isEventPast(event.status)) return;
    setRsvping(true);
    try {
      if (hasRsvped) {
        var r = await eventsApi.cancelRsvp(event._id);
        setHasRsvped(false); setRsvpCount(r.data.data.rsvpCount); toast("RSVP cancelled");
      } else {
        var r2 = await eventsApi.rsvp(event._id);
        setHasRsvped(true); setRsvpCount(r2.data.data.rsvpCount); toast.success("You are going!");
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setRsvping(false); }
  }

  async function handleReminder() {
    if (!event || reminding || isEventPast(event.status)) return;
    setReminding(true);
    try {
      if (reminderSet) {
        await eventsApi.removeReminder(event._id); setReminderSet(false); toast("Reminder removed");
      } else {
        await eventsApi.setReminder(event._id); setReminderSet(true);
        toast.success("Reminder set. We will notify you before the event starts.");
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setReminding(false); }
  }

  function handleGoogleCalendar() {
    if (!event) return;
    window.open(generateGoogleCalendarUrl({ title: event.title, details: event.details, startDate: event.startDate, endDate: event.endDate, location: event.location }), "_blank", "noopener,noreferrer");
  }

  function handleDownloadICal() {
    if (!event) return;
    downloadICal({ _id: event._id, title: event.title, details: event.details, startDate: event.startDate, endDate: event.endDate, location: event.location });
    toast.success("Calendar file downloaded");
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center"
          style={{ boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading event...</p>
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="card p-12">
        <p className="text-base font-black text-surface-900 mb-2">Event not found</p>
        <p className="text-sm text-surface-400 mb-6">{error}</p>
        <Button variant="secondary" onClick={function() { router.push("/events"); }}>Back to events</Button>
      </div>
    </div>
  );

  var startDate   = new Date(event.startDate);
  var endDate     = new Date(event.endDate);
  var isPast      = isEventPast(event.status);
  var isLive      = isEventLive(event.status);
  var isFull      = isEventFull(rsvpCount, event.maxAttendees);
  var capacityPct = event.maxAttendees ? getCapacityPercent(rsvpCount, event.maxAttendees) : 0;
  var barColor    = getCapacityBarColor(capacityPct);
  var spotsLeft   = getSpotsRemaining(rsvpCount, event.maxAttendees);
  var dateStr     = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  var startTime   = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  var endTime     = endDate.toLocaleTimeString("en-US",   { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  var gradient    = TYPE_GRADIENTS[event.type] || TYPE_GRADIENTS.webinar;
  var emoji       = TYPE_EMOJIS[event.type]    || "📅";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f0f2ff 0%, #f8fafc 320px)" }}>
      <div className="max-w-4xl mx-auto px-4 py-7">
        <button onClick={function() { router.push("/events"); }}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 font-semibold mb-6 transition-colors">
          <ArrowLeft size={14} />Back to events
        </button>

        <div className="relative overflow-hidden rounded-2xl mb-6" style={{ background: gradient, minHeight: 160 }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1' fill='%234f46e5' fill-opacity='1'/%3E%3C/svg%3E\")" }} />
          <div className="relative p-7 flex items-end gap-5">
            <div className="text-5xl leading-none">{emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <EventBadge type={event.type} status={event.status} size="md" />
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-500 text-white"
                    style={{ boxShadow: "0 0 12px rgba(239,68,68,0.5)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Happening now
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-surface-900 tracking-tight leading-snug">{event.title}</h1>
            </div>
          </div>
        </div>

        {event.coverImageUrl && (
          <img src={event.coverImageUrl} alt={event.title}
            className="w-full h-52 object-cover rounded-2xl mb-6 border border-surface-200" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-surface-200 rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h2 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-3">About this event</h2>
              <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-line">{event.details}</p>
            </div>

            {event.tags.length > 0 && (
              <div className="bg-white border border-surface-200 rounded-2xl p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={12} className="text-surface-400" />
                  <span className="text-xs font-black text-surface-500 uppercase tracking-widest">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map(function(tag) {
                    return (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        #{tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {event.community && (
              <div className="bg-white border border-surface-200 rounded-2xl p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="text-xs text-surface-400 font-medium mb-1.5">Hosted by</p>
                <Link href={"/communities/" + event.community.slug}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                  {event.community.name}
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-surface-200 rounded-2xl p-5 sticky top-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-surface-400" />
                <span className="text-sm font-bold text-surface-900">
                  {formatCount(rsvpCount)}{event.maxAttendees ? " / " + formatCount(event.maxAttendees) : ""} attending
                </span>
              </div>
              {event.maxAttendees && (
                <div className="mb-4">
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full transition-all duration-700 " + barColor} style={{ width: capacityPct + "%" }} />
                  </div>
                  <p className="text-[11px] text-surface-400 mt-1.5 font-medium">
                    {isFull ? "No spots remaining" : spotsLeft !== null ? spotsLeft + " spot" + (spotsLeft === 1 ? "" : "s") + " remaining" : ""}
                  </p>
                </div>
              )}
              {!isPast && (
                <div className="space-y-2">
                  <Button fullWidth variant={hasRsvped ? "secondary" : "primary"} loading={rsvping}
                    disabled={!hasRsvped && isFull} onClick={handleRsvp}>
                    {hasRsvped ? "You are going" : isFull ? "Event is full" : "RSVP to this event"}
                  </Button>
                  <button onClick={handleReminder} disabled={reminding}
                    className={["w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 border",
                      reminderSet ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-surface-50 text-surface-600 border-surface-200 hover:border-amber-300 hover:text-amber-700"
                    ].join(" ")}>
                    {reminderSet ? <Bell size={12} /> : <BellOff size={12} />}
                    {reminderSet ? "Reminder is on" : "Set a reminder"}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-surface-200 rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-4">When & Where</h3>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                    <Calendar size={13} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">{dateStr}</p>
                    <p className="text-xs text-surface-500 mt-0.5 flex items-center gap-1">
                      <Clock size={10} />{startTime} – {endTime}
                    </p>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <MapPin size={13} className="text-emerald-600" />
                    </div>
                    <p className="text-sm text-surface-700 font-medium">{event.location}</p>
                  </div>
                )}
                {event.meetingUrl && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Video size={13} className="text-blue-600" />
                    </div>
                    <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 transition-colors">
                      Join meeting <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {!isPast && (
              <div className="bg-white border border-surface-200 rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <h3 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-3">Add to calendar</h3>
                <div className="space-y-2">
                  <button onClick={handleGoogleCalendar}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-surface-200 hover:bg-brand-50 hover:border-brand-300 transition-all text-sm font-semibold text-surface-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Google Calendar
                  </button>
                  <button onClick={handleDownloadICal}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-surface-200 hover:bg-brand-50 hover:border-brand-300 transition-all text-sm font-semibold text-surface-700">
                    <Download size={14} className="text-surface-500" />
                    Download .ics
                    <span className="ml-auto text-xs text-surface-400">Outlook / Apple</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-surface-200 rounded-2xl p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <h3 className="text-xs font-black text-surface-500 uppercase tracking-widest mb-3">Organizer</h3>
              <Link href={"/profile/" + event.organizer._id}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-black shrink-0"
                  style={{ boxShadow: "0 0 0 2px white, 0 0 0 3px rgba(99,102,241,0.2)" }}>
                  {event.organizer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-surface-900 group-hover:text-brand-700 transition-colors">{event.organizer.name}</p>
                  <p className="text-[10px] text-surface-400 font-medium">Event organizer</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
