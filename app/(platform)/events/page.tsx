"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Calendar, Loader2, Plus, Sparkles, Video, MapPin, Globe } from "lucide-react";
import Link from "next/link";
import { eventsApi, type CCEvent, type EventFilter } from "@/lib/api/events.api";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/auth.store";

var FILTER_TABS: { id: EventFilter; label: string; emoji: string }[] = [
  { id: "upcoming", label: "Upcoming", emoji: "🗓️" },
  { id: "live",     label: "Live Now", emoji: "🔴" },
  { id: "past",     label: "Past",     emoji: "📁" }
];

var TYPE_FILTERS = [
  { id: "all",     label: "All",      icon: null     },
  { id: "webinar", label: "Webinars", icon: Video    },
  { id: "meetup",  label: "Meetups",  icon: MapPin   },
  { id: "room",    label: "Rooms",    icon: Globe    }
];

export default function EventsPage() {
  var [filter,     setFilter]     = useState<EventFilter>("upcoming");
  var [typeFilter, setTypeFilter] = useState("all");
  var [events,     setEvents]     = useState<CCEvent[]>([]);
  var [loading,    setLoading]    = useState(true);
  var [error,      setError]      = useState("");
  var [page,       setPage]       = useState(1);
  var [hasMore,    setHasMore]    = useState(false);
  var { user }                    = useAuthStore();

  var isModerator = !!(user && (user.role === "moderator" || user.role === "admin" || user.role === "super_admin"));

  var loadEvents = useCallback(function(f: EventFilter, t: string, p: number, replace: boolean) {
    setLoading(true);
    setError("");
    eventsApi
      .getEvents(f, t, p)
      .then(function(res) {
        var raw  = res.data as any;
        var list: CCEvent[] = [];
        if (Array.isArray(raw))                            list = raw;
        else if (Array.isArray(raw.data))                  list = raw.data;
        else if (raw.data && Array.isArray(raw.data.data)) list = raw.data.data;
        if (replace) setEvents(list); else setEvents(function(prev) { return [...prev, ...list]; });
        var meta = raw.data || raw;
        setHasMore(meta && meta.totalPages ? p < meta.totalPages : false);
        setPage(p);
      })
      .catch(function(err) { setError(getErrorMessage(err)); })
      .finally(function() { setLoading(false); });
  }, []);

  useEffect(function() { loadEvents(filter, typeFilter, 1, true); }, [filter, typeFilter, loadEvents]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f0f2ff 0%, #f8fafc 280px)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl mb-8 p-7"
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.35)"
          }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='0.8' fill='white'/%3E%3C/svg%3E\")" }} />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-200" />
                <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">Community Events</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-1 tracking-tight">Events & Meetups</h1>
              <p className="text-sm text-indigo-200 font-medium">Live webinars, in-person meetups and community rooms.</p>
            </div>
            {isModerator && (
              <Link href="/events/create">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-sm font-bold text-white transition-all backdrop-blur-sm">
                  <Plus size={15} />New Event
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-white border border-surface-200 rounded-2xl p-1.5 shadow-card mb-4"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          {FILTER_TABS.map(function(tab) {
            var active = filter === tab.id;
            return (
              <button key={tab.id} onClick={function() { setFilter(tab.id); }}
                className={[
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150",
                  active ? "bg-brand-600 text-white shadow-md" : "text-surface-500 hover:text-surface-900 hover:bg-surface-100"
                ].join(" ")}>
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Type chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TYPE_FILTERS.map(function(tf) {
            var active = typeFilter === tf.id;
            return (
              <button key={tf.id} onClick={function() { setTypeFilter(tf.id); }}
                className={[
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border",
                  active
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-700"
                ].join(" ")}>
                {tf.icon && React.createElement(tf.icon, { size: 11 })}
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* States */}
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}>
              <Loader2 size={22} className="animate-spin text-brand-500" />
            </div>
            <p className="text-sm font-semibold text-surface-500">Loading events...</p>
          </div>
        ) : error ? (
          <div className="card p-10 text-center">
            <p className="text-sm font-bold text-surface-900 mb-1">Could not load events</p>
            <p className="text-xs text-surface-400 mb-5">{error}</p>
            <Button variant="secondary" size="sm" onClick={function() { loadEvents(filter, typeFilter, 1, true); }}>Try again</Button>
          </div>
        ) : events.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-5 text-3xl">📅</div>
            <p className="text-base font-black text-surface-900 mb-1.5">No {filter} events</p>
            <p className="text-sm text-surface-400">Check back soon — something exciting is being planned.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(function(event) { return <EventCard key={event._id} event={event} />; })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="secondary" loading={loading}
                  onClick={function() { loadEvents(filter, typeFilter, page + 1, false); }}>
                  Load more events
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
