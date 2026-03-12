"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, MapPin,
  Video, Users, Bell, BellOff,
  ExternalLink, Loader2, Download
} from "lucide-react";
import { eventsApi, type CCEvent } from "@/lib/api/events.api";
import { EventBadge } from "@/components/events/EventBadge";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/utils";
import {
  isEventPast,
  isEventLive,
  isEventFull,
  getCapacityPercent,
  getCapacityBarColor,
  getSpotsRemaining
} from "@/lib/utils/events";
import {
  generateGoogleCalendarUrl,
  downloadICal
} from "@/lib/utils/calendar";
import { getErrorMessage } from "@/lib/api/client";
import Link from "next/link";
import toast from "react-hot-toast";

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
    eventsApi
      .getEvent(eventId)
      .then(function(res) {
        var e = res.data.data;
        setEvent(e);
        setHasRsvped(e.hasRsvped);
        setRsvpCount(e.rsvpCount);
        setReminderSet(e.reminderSet);
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
        setHasRsvped(false);
        setRsvpCount(r.data.data.rsvpCount);
        toast("RSVP cancelled");
      } else {
        var r2 = await eventsApi.rsvp(event._id);
        setHasRsvped(true);
        setRsvpCount(r2.data.data.rsvpCount);
        toast.success("You are going!");
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRsvping(false);
    }
  }

  async function handleReminder() {
    if (!event || reminding || isEventPast(event.status)) return;
    setReminding(true);
    try {
      if (reminderSet) {
        await eventsApi.removeReminder(event._id);
        setReminderSet(false);
        toast("Reminder removed");
      } else {
        await eventsApi.setReminder(event._id);
        setReminderSet(true);
        toast.success("Reminder set. We will notify you before the event starts.");
      }
    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReminding(false);
    }
  }

  function handleGoogleCalendar() {
    if (!event) return;
    var url = generateGoogleCalendarUrl({
      title:     event.title,
      details:   event.details,
      startDate: event.startDate,
      endDate:   event.endDate,
      location:  event.location
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleDownloadICal() {
    if (!event) return;
    downloadICal({
      _id:       event._id,
      title:     event.title,
      details:   event.details,
      startDate: event.startDate,
      endDate:   event.endDate,
      location:  event.location
    });
    toast.success("Calendar file downloaded");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="font-semibold text-surface-900 mb-1">Event not found</p>
        <p className="text-sm text-surface-400 mb-4">{error}</p>
        <Button variant="secondary" onClick={function() { router.push("/events"); }}>
          Back to events
        </Button>
      </div>
    );
  }

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      <button
        onClick={function() { router.push("/events"); }}
        className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors mb-5 font-medium"
      >
        <ArrowLeft size={15} />
        Back to events
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-5">

          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-48 object-cover rounded-2xl"
            />
          ) : (
            <div
              className="w-full h-32 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
            >
              <Calendar size={40} className="text-white opacity-50" />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <EventBadge type={event.type} status={event.status} size="md" />
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-danger-50 text-danger-600 border border-danger-200">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-pulse" />
                Happening now
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-surface-900 leading-tight">{event.title}</h1>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-surface-900 mb-3">About this event</h2>
            <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-line">{event.details}</p>
          </div>

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map(function(tag) {
                return (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-500 border border-surface-200">
                    #{tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} className="text-surface-400" />
              <span className="text-sm font-semibold text-surface-900">
                {formatCount(rsvpCount)}
                {event.maxAttendees ? " / " + formatCount(event.maxAttendees) : ""}
                {" attending"}
              </span>
            </div>

            {event.maxAttendees && (
              <div className="mb-4">
                <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className={"h-full rounded-full transition-all duration-500 " + barColor}
                    style={{ width: capacityPct + "%" }}
                  />
                </div>
                <p className="text-xs text-surface-400 mt-1">
                  {isFull
                    ? "No spots remaining"
                    : spotsLeft !== null
                      ? spotsLeft + " spot" + (spotsLeft === 1 ? "" : "s") + " remaining"
                      : ""}
                </p>
              </div>
            )}

            {!isPast && (
              <div>
                <Button
                  fullWidth
                  variant={hasRsvped ? "secondary" : "primary"}
                  loading={rsvping}
                  disabled={!hasRsvped && isFull}
                  onClick={handleRsvp}
                  className="mb-2"
                >
                  {hasRsvped ? "Cancel RSVP" : isFull ? "Event is full" : "RSVP to this event"}
                </Button>

                <button
                  onClick={handleReminder}
                  disabled={reminding}
                  className={[
                    "w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-150 border",
                    reminderSet
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-surface-50 text-surface-600 border-surface-200 hover:border-amber-300 hover:text-amber-700"
                  ].join(" ")}
                >
                  {reminderSet ? <Bell size={13} /> : <BellOff size={13} />}
                  {reminderSet ? "Reminder is on" : "Set a reminder"}
                </button>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">Date &amp; time</h3>
            <div className="flex items-start gap-2.5">
              <Calendar size={15} className="text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-surface-900">{dateStr}</p>
                <p className="text-xs text-surface-500 mt-0.5">{startTime} {"-"} {endTime}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-brand-500 shrink-0 mt-0.5" />
                <p className="text-sm text-surface-700">{event.location}</p>
              </div>
            )}
            {event.meetingUrl && (
              <div className="flex items-start gap-2.5">
                <Video size={15} className="text-brand-500 shrink-0 mt-0.5" />
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
                >
                  Join meeting
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {!isPast && (
            <div className="card p-5">
              <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Add to calendar</h3>
              <div className="space-y-2">
                <button
                  onClick={handleGoogleCalendar}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 hover:border-brand-300 transition-all text-sm font-medium text-surface-700"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Google Calendar
                </button>
                <button
                  onClick={handleDownloadICal}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 hover:border-brand-300 transition-all text-sm font-medium text-surface-700"
                >
                  <Download size={15} className="text-surface-500 shrink-0" />
                  Download .ics
                  <span className="ml-auto text-xs text-surface-400">Outlook / Apple</span>
                </button>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Organizer</h3>
            <Link
              href={"/profile/" + event.organizer._id}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                {event.organizer.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-surface-900">{event.organizer.name}</span>
            </Link>
          </div>

          {event.community && (
            <div className="card p-4">
              <p className="text-xs text-surface-400 mb-1">Hosted by</p>
              <Link
                href={"/communities/" + event.community.slug}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                {event.community.name}
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
