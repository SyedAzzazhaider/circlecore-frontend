"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Video, Users, Bell, BellOff, ArrowUpRight } from "lucide-react";
import { type CCEvent, eventsApi } from "@/lib/api/events.api";
import { EventBadge } from "./EventBadge";
import { Button } from "@/components/ui/Button";
import { formatCount } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/client";
import toast from "react-hot-toast";

var TYPE_GRADIENTS = {
  webinar: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
  meetup:  "linear-gradient(135deg, #d1fae5 0%, #dbeafe 100%)",
  room:    "linear-gradient(135deg, #fdf4ff 0%, #ede9fe 100%)"
};

var TYPE_ICONS = {
  webinar: "🎙️",
  meetup:  "🤝",
  room:    "💬"
};

type EventCardProps = {
  event:     CCEvent;
  onUpdate?: (event: CCEvent) => void;
};

export function EventCard({ event, onUpdate }: EventCardProps) {
  var [rsvping,     setRsvping]     = useState(false);
  var [reminding,   setReminding]   = useState(false);
  var [hasRsvped,   setHasRsvped]   = useState(event.hasRsvped);
  var [rsvpCount,   setRsvpCount]   = useState(event.rsvpCount);
  var [reminderSet, setReminderSet] = useState(event.reminderSet);

  var startDate = new Date(event.startDate);
  var endDate   = new Date(event.endDate);
  var isPast    = event.status === "past";
  var isLive    = event.status === "live";
  var isFull    = event.maxAttendees ? rsvpCount >= event.maxAttendees : false;

  var dateStr = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  var timeStr = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) +
                " – " +
                endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  async function handleRsvp() {
    if (rsvping || isPast) return;
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
        if (onUpdate) onUpdate(Object.assign({}, event, { hasRsvped: true, rsvpCount: r2.data.data.rsvpCount }));
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setRsvping(false); }
  }

  async function handleReminder() {
    if (reminding || isPast) return;
    setReminding(true);
    try {
      if (reminderSet) {
        await eventsApi.removeReminder(event._id);
        setReminderSet(false);
        toast("Reminder removed");
      } else {
        await eventsApi.setReminder(event._id);
        setReminderSet(true);
        toast.success("Reminder set!");
      }
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setReminding(false); }
  }

  var gradient = TYPE_GRADIENTS[event.type] || TYPE_GRADIENTS.webinar;
  var emoji    = TYPE_ICONS[event.type] || "📅";

  return (
    <article className={[
      "group bg-white border border-surface-200 rounded-2xl overflow-hidden transition-all duration-200",
      "hover:border-surface-300 hover:shadow-xl hover:shadow-surface-900/[0.06] hover:-translate-y-0.5",
      isPast ? "opacity-60" : ""
    ].join(" ")}>

      {/* Hero strip */}
      <div className="relative h-24 flex items-end p-4" style={{ background: gradient }}>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500 text-white shadow-lg"
              style={{ boxShadow: "0 0 12px rgba(239,68,68,0.5)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
            </span>
          )}
          {!isPast && (
            <button onClick={handleReminder} disabled={reminding} title={reminderSet ? "Remove reminder" : "Set reminder"}
              className={[
                "w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-150 backdrop-blur-sm",
                reminderSet ? "bg-amber-400/90 text-white shadow-md" : "bg-white/70 text-surface-500 hover:bg-white hover:text-amber-500"
              ].join(" ")}>
              {reminderSet ? <Bell size={13} /> : <BellOff size={13} />}
            </button>
          )}
        </div>
        <div className="flex items-end gap-3">
          <div className="text-3xl leading-none">{emoji}</div>
          <EventBadge type={event.type} size="sm" />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        <Link href={"/events/" + event._id} className="block group/title">
          <h3 className="text-sm font-black text-surface-900 group-hover/title:text-brand-700 transition-colors leading-snug tracking-tight line-clamp-2">
            {event.title}
          </h3>
          <p className="text-xs text-surface-500 mt-1.5 line-clamp-2 leading-relaxed">{event.details}</p>
        </Link>

        {/* Meta info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-surface-500 font-medium">
            <Calendar size={11} className="text-brand-400 shrink-0" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-surface-500 font-medium">
            <Clock size={11} className="text-brand-400 shrink-0" />
            <span>{timeStr}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-[11px] text-surface-500 font-medium">
              <MapPin size={11} className="text-brand-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {!event.location && event.meetingUrl && (
            <div className="flex items-center gap-2 text-[11px] text-surface-500 font-medium">
              <Video size={11} className="text-brand-400 shrink-0" />
              <span>Online event</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-100 mt-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-500">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-50 border border-surface-200">
              <Users size={10} className="text-surface-400" />
              <span>{formatCount(rsvpCount)}{event.maxAttendees ? " / " + formatCount(event.maxAttendees) : ""}</span>
            </div>
          </div>
          {!isPast ? (
            <Button size="sm" variant={hasRsvped ? "secondary" : "primary"}
              loading={rsvping} disabled={!hasRsvped && isFull} onClick={handleRsvp}>
              {hasRsvped ? "Cancel RSVP" : isFull ? "Full" : "RSVP"}
            </Button>
          ) : (
            <Link href={"/events/" + event._id}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-400 hover:text-brand-600 transition-colors">
              View recap <ArrowUpRight size={10} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
