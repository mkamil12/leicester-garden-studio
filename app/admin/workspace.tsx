"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import "./workspace.css";
type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
  service: string;
  date: string;
  time: string;
  size: string;
  notes: string;
  status: string;
  demo: number;
  assignee: string;
  internal_notes: string;
  created: string;
};
const labels: Record<string, string> = {
  regular: "Regular garden maintenance",
  oneoff: "Garden clearance",
  lawn: "Hedges, trees & lawns",
};
const fieldLabels: Record<string, string> = {
  intro: "Company introduction",
  heroTitle: "Hero title (reserved)",
  regularPrice: "Regular maintenance price label",
  oneoffPrice: "One-off care price label",
  lawnPrice: "Lawn treatment price label",
  regularDescription: "Regular service description",
  oneoffDescription: "One-off service description",
  lawnDescription: "Lawn service description",
  bookingNote: "Booking guidance",
  contactEmail: "Approved public business email (reserved)",
  contactPhone: "Approved business phone (reserved)",
  area: "Service area (reserved)",
  publicNotice: "Preview disclosure",
};
export default function Workspace() {
  const [data, setData] = useState<any>(null),
    [tab, setTab] = useState("bookings"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<Booking | null>(null),
    [field, setField] = useState("intro"),
    [draft, setDraft] = useState(""),
    [revisions, setRevisions] = useState<any[]>([]),
    [date, setDate] = useState(""),
    [note, setNote] = useState(""),
    [memberEmail, setMemberEmail] = useState(""),
    [memberRole, setMemberRole] = useState("editor");
  async function load() {
    const response = await fetch("/api/admin");
    const result: any = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(result);
    return result;
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = document.querySelector(".detail-panel") as HTMLElement | null;
    const first = panel?.querySelector("button") as HTMLElement | null;
    first?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      if (event.key === "Tab" && panel) {
        const elements = [
          ...panel.querySelectorAll<HTMLElement>(
            "button,a[href],input,select,textarea",
          ),
        ].filter((e) => !e.hasAttribute("disabled"));
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [selected?.id]);
  useEffect(() => {
    if (data) {
      const row = data.content.find((r: any) => r.key === field);
      setDraft(row?.draft ?? data.defaults[field] ?? "");
      setRevisions([]);
    }
  }, [field, data]);
  async function mutate(path: string, payload: any, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: any = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      setMessage(success);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <main className="workspace-loading">
        <h1>Opening your workspace…</h1>
        <p role="alert">{error}</p>
      </main>
    );
  const bookings: Booking[] = data.bookings;
  const filtered = bookings.filter(
    (b) =>
      (filter === "all" || b.status === filter) &&
      [b.name, b.email, b.postcode, b.id, b.assignee]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="workspace">
      <aside className="workspace-sidebar">
        <a href="/" className="workspace-brand">
          <img
            src="/assets/mma/logo.png"
            alt="MMA Garden Services"
            style={{
              width: 42,
              height: 42,
              display: "inline-block",
              verticalAlign: "middle",
              borderRadius: 8,
              marginRight: 8,
            }}
          />{" "}
          MMA studio<small>OWNER WORKSPACE</small>
        </a>
        <div className="workspace-project">
          Leicester
          <br />
          <strong>Gardening Services</strong>
          <span>Website & enquiries</span>
        </div>
        <nav aria-label="Workspace navigation">
          {[
            ["bookings", "◷", "Visit requests"],
            ["content", "▤", "Website content"],
            ["availability", "▦", "Availability"],
            ...(data.user.role === "admin"
              ? [["team", "♧", "Team access"]]
              : []),
          ].map(([key, icon, title]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key);
                setMessage("");
                setError("");
              }}
            >
              <span>{icon}</span>
              {title}
            </button>
          ))}
        </nav>
        <div className="workspace-sidebar-bottom">
          <a href="/" target="_blank">
            View website ↗
          </a>
          <a href="/proposal" target="_blank">
            Project proposal ↗
          </a>
          <a href="/auth/signout" target="_top">
            Sign out
          </a>
          <small>
            {data.user.email}
            <br />
            {data.user.role === "admin"
              ? "Administrator"
              : "Editor / booking staff"}
          </small>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <span>MMA GARDEN STUDIO</span>
            <h1>
              {tab === "bookings"
                ? "A little order. More room to grow."
                : tab === "content"
                  ? "Make the words your own."
                  : tab === "availability"
                    ? "Make room in the diary."
                    : "The right people. The right access."}
            </h1>
          </div>
          <Badge variant="outline">
            {data.demo ? "Preview · test requests" : "Live requests"}
          </Badge>
        </header>
        <div aria-live="polite">
          {message && <p className="workspace-success">{message}</p>}
          {error && (
            <p className="workspace-error" role="alert">
              {error}
            </p>
          )}
        </div>
        {tab === "bookings" && (
          <>
            <div className="workspace-stats">
              {[
                ["Total requests", bookings.length],
                [
                  "To review",
                  bookings.filter((b) =>
                    ["new", "reviewing"].includes(b.status),
                  ).length,
                ],
                [
                  "Accepted visits",
                  bookings.filter((b) => b.status === "accepted").length,
                ],
                [
                  "With garden photos",
                  new Set(data.photos.map((p: any) => p.booking_id)).size,
                ],
              ].map(([name, n]) => (
                <Card key={name}>
                  <CardContent className="stat-content">
                    <span>{name}</span>
                    <strong>{n}</strong>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <div className="table-heading">
                  <div>
                    <CardTitle>Visit requests</CardTitle>
                    <p>
                      Review the garden before planning the journey. All times
                      are UK local time.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      load()
                        .then(() => setMessage("Workspace refreshed"))
                        .catch((e) => setError(e.message))
                    }
                  >
                    Refresh
                  </Button>
                </div>
                <div className="table-controls">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search requests"
                    placeholder="Search name, postcode, team member or reference…"
                  />
                  <select
                    aria-label="Filter request status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {[
                      "new",
                      "reviewing",
                      "accepted",
                      "declined",
                      "completed",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Customer / site</th>
                          <th>Service</th>
                          <th>Preferred window</th>
                          <th>Status</th>
                          <th>Photos</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <strong>{b.name}</strong>
                              <small>
                                {b.postcode} {b.demo ? "· Test" : ""}
                              </small>
                            </td>
                            <td>
                              {labels[b.service]}
                              <small>{b.size}</small>
                            </td>
                            <td>
                              {b.date}
                              <small>{b.time} · UK time</small>
                            </td>
                            <td>
                              <Badge
                                variant="outline"
                                className={"status-" + b.status}
                              >
                                {b.status}
                              </Badge>
                            </td>
                            <td>
                              {
                                data.photos.filter(
                                  (p: any) => p.booking_id === b.id,
                                ).length
                              }
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelected({ ...b })}
                              >
                                Review ↗
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span>✳</span>
                    <h2>
                      {bookings.length
                        ? "No requests match this view."
                        : "A little space, ready for the next request."}
                    </h2>
                    <p>
                      {bookings.length
                        ? "Try a different search or status."
                        : "New visit requests will appear here with garden photos, service choices and preferred windows."}
                    </p>
                    <a href="/booking" target="_blank">
                      Try a test booking ↗
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        {tab === "content" && (
          <div className="workspace-two-col">
            <Card>
              <CardHeader>
                <CardTitle>Content studio</CardTitle>
                <p>Editors can save drafts. Administrators can publish them.</p>
              </CardHeader>
              <CardContent>
                <label>
                  Content field
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                  >
                    {Object.keys(data.defaults)
                      .filter(
                        (k) =>
                          ![
                            "heroTitle",
                            "contactEmail",
                            "contactPhone",
                            "area",
                          ].includes(k),
                      )
                      .map((k) => (
                        <option value={k} key={k}>
                          {fieldLabels[k] || k}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Draft
                  <Textarea
                    rows={8}
                    value={draft}
                    maxLength={3000}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
                <div className="workspace-actions">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      mutate(
                        "content",
                        { key: field, value: draft, action: "draft" },
                        "Draft saved. The public page is unchanged.",
                      )
                    }
                  >
                    Save draft
                  </Button>
                  {data.user.role === "admin" && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await mutate(
                            "content",
                            { key: field, value: draft, action: "draft" },
                            "Draft saved",
                          )
                        )
                          await mutate(
                            "content",
                            { key: field, action: "publish" },
                            "Published. Refresh the public page to see the change.",
                          );
                      }}
                    >
                      Publish this field ↗
                    </Button>
                  )}
                </div>
                <p className="workspace-hint">
                  Price labels should be approved business rates, including the
                  unit, any minimum charge and VAT treatment. Keep the preview
                  disclosure until the business approves launch.
                </p>
              </CardContent>
            </Card>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Currently published</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="published-content">
                    {data.content.find((r: any) => r.key === field)
                      ?.published ?? data.defaults[field]}
                  </p>
                  <a
                    href={field.includes("Price") ? "/pricing" : "/"}
                    target="_blank"
                  >
                    Open public website ↗
                  </a>
                </CardContent>
              </Card>
              {data.user.role === "admin" && (
                <Card className="revision-card">
                  <CardHeader>
                    <CardTitle>Revision history</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            "/api/admin/revisions?key=" + field,
                          );
                          const result: any = await response.json();
                          if (!response.ok) throw new Error(result.error);
                          setRevisions(result);
                        } catch (e: any) {
                          setError(e.message);
                        }
                      }}
                    >
                      Load revisions
                    </Button>
                    {revisions.map((r) => (
                      <article key={r.id} className="revision">
                        <small>
                          {new Date(r.created).toLocaleString("en-GB")}
                        </small>
                        <p>{r.value}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            mutate(
                              "content",
                              {
                                action: "rollback",
                                key: field,
                                revision: r.id,
                              },
                              "Revision restored into draft. Review it before publishing.",
                            )
                          }
                        >
                          Restore to draft
                        </Button>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        {tab === "availability" && (
          <div className="workspace-two-col">
            <Card>
              <CardHeader>
                <CardTitle>Close or reopen a day</CardTitle>
                <p>
                  Windows are 09:00–11:00, 11:00–13:00 and 14:00–16:00, Monday
                  to Saturday. One accepted visit per window.
                </p>
              </CardHeader>
              <CardContent>
                <label>
                  Date
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </label>
                <label>
                  Internal note
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Holiday, team training…"
                    maxLength={200}
                  />
                </label>
                <div className="workspace-actions">
                  <Button
                    disabled={busy || !date || data.user.role !== "admin"}
                    onClick={() =>
                      mutate(
                        "availability",
                        { date, closed: true, note },
                        "Day closed to new visit requests.",
                      )
                    }
                  >
                    Close this day
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || !date || data.user.role !== "admin"}
                    onClick={() =>
                      mutate(
                        "availability",
                        { date, closed: false, note },
                        "Day reopened.",
                      )
                    }
                  >
                    Reopen this day
                  </Button>
                </div>
                <p className="workspace-hint">
                  A date with an accepted visit cannot be closed until that
                  visit is moved or declined. Requests are not automatically
                  recurring appointments.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Diary exceptions</CardTitle>
              </CardHeader>
              <CardContent>
                {data.availability.length ? (
                  data.availability.map((day: any) => (
                    <div className="diary-row" key={day.date}>
                      <strong>{day.date}</strong>
                      <Badge variant="outline">
                        {day.closed ? "Closed" : "Open"}
                      </Badge>
                      <span>{day.note}</span>
                    </div>
                  ))
                ) : (
                  <p className="workspace-hint">
                    No date exceptions. The standard weekly windows apply.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {tab === "team" && data.user.role === "admin" && (
          <div className="workspace-two-col">
            <Card>
              <CardHeader>
                <CardTitle>Individual team access</CardTitle>
                <p>
                  Each person signs in with their own email account. No shared
                  passwords.
                </p>
              </CardHeader>
              <CardContent>
                <label>
                  Sign-in email
                  <Input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="owner@example.com"
                  />
                </label>
                <label>
                  Role
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                  >
                    <option value="editor">Editor / booking staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
                <Button
                  disabled={busy || !memberEmail}
                  onClick={async () => {
                    if (
                      await mutate(
                        "member",
                        { email: memberEmail, role: memberRole },
                        "Access list updated. No invitation email has been sent.",
                      )
                    )
                      setMemberEmail("");
                  }}
                >
                  Add to access list
                </Button>
                <p className="workspace-hint">
                  Editors can review bookings and photos and save content
                  drafts. Administrators also publish content, manage dates and
                  grant access. Share the workspace URL separately with an
                  authorised team member.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Authorised members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="member-row">
                  <div>
                    <strong>Studio owner</strong>
                    <small>Protected hosting allowlist</small>
                  </div>
                  <Badge variant="outline">admin</Badge>
                </div>
                {data.members.map((m: any) => (
                  <div key={m.email} className="member-row">
                    <div>
                      <strong>{m.email}</strong>
                      <small>{m.role}</small>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        mutate(
                          "member",
                          { email: m.email, role: "remove" },
                          "Member access removed.",
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        <footer className="workspace-footer">
          {data.demo
            ? "Preview workspace · test data only · no email notifications are sent."
            : "Owner workspace · check final details before accepting a visit."}
          <span>Access is enforced on the server.</span>
        </footer>
      </main>
      {selected && (
        <div className="detail-overlay" onClick={() => setSelected(null)}>
          <section
            className="detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-header">
              <div>
                <span className="workspace-kicker">VISIT REQUEST</span>
                <h2 id="detail-title">{selected.name}</h2>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
                aria-label="Close request"
              >
                ✕
              </Button>
            </div>
            <p className="reference">{selected.id}</p>
            <div className="detail-meta">
              <p>
                <strong>Service</strong>
                {labels[selected.service]} · {selected.size}
              </p>
              <p>
                <strong>Preferred window</strong>
                {selected.date} · {selected.time} UK time
              </p>
              <p>
                <strong>Site</strong>
                {selected.address}
                <br />
                {selected.postcode}
              </p>
              <p>
                <strong>Contact</strong>
                <a href={"mailto:" + selected.email}>{selected.email}</a>
                <br />
                <a href={"tel:" + selected.phone}>{selected.phone}</a>
              </p>
            </div>
            <h3>About the garden</h3>
            <p className="customer-notes">
              {selected.notes || "No additional notes."}
            </p>
            <div className="detail-photos">
              {data.photos
                .filter((p: any) => p.booking_id === selected.id)
                .map((p: any) => (
                  <a
                    href={"/api/photos/" + p.id}
                    target="_blank"
                    key={p.id}
                    rel="noopener"
                  >
                    <img
                      src={"/api/photos/" + p.id}
                      alt="Customer-supplied garden photo for private review"
                    />
                  </a>
                ))}
            </div>
            <label>
              Status
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected({ ...selected, status: e.target.value })
                }
              >
                {["new", "reviewing", "accepted", "declined", "completed"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Assign to team member
              <Input
                value={selected.assignee}
                onChange={(e) =>
                  setSelected({ ...selected, assignee: e.target.value })
                }
                maxLength={100}
                placeholder="Name or team"
              />
            </label>
            <label>
              Internal notes
              <Textarea
                value={selected.internal_notes}
                onChange={(e) =>
                  setSelected({ ...selected, internal_notes: e.target.value })
                }
                maxLength={4000}
                rows={4}
              />
            </label>
            <p className="workspace-hint">
              Accepting reserves this window. It does not send a notification.
              Contact the customer separately to agree the price, scope and
              appointment.
            </p>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(
                    "booking",
                    {
                      id: selected.id,
                      status: selected.status,
                      assignee: selected.assignee,
                      internalNotes: selected.internal_notes,
                    },
                    "Request updated. No notification has been sent.",
                  )
                )
                  setSelected(null);
              }}
            >
              Save request
            </Button>
            <p className="workspace-error" role="alert">
              {error}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
