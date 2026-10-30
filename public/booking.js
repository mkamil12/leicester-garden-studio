"use strict";
(() => {
  const form = document.getElementById("booking-form"),
    error = document.getElementById("booking-error"),
    panels = [...form.querySelectorAll("[data-step]")];
  let step = 0,
    from = new Date(Date.now() + 86400000),
    days = [],
    photos = [],
    requestId = crypto.randomUUID(),
    demo = true;
  const f = (name) => form.elements.namedItem(name);
  const query = new URLSearchParams(location.search).get("service");
  if (["regular", "oneoff", "lawn"].includes(query)) f("service").value = query;
  function message(text) {
    error.textContent = text;
  }
  function show(n) {
    step = n;
    panels.forEach((p, i) => (p.hidden = i !== step));
    document
      .querySelectorAll("[data-step-label]")
      .forEach((p, i) => p.classList.toggle("active", i === step));
    message("");
    if (step === 2) {
      const box = document.getElementById("request-summary");
      box.replaceChildren();
      const strong = document.createElement("strong");
      strong.textContent = {
        regular: "Regular garden maintenance",
        oneoff: "Garden clearance",
        lawn: "Hedges, trees & lawns",
      }[f("service").value];
      box.append(
        strong,
        document.createElement("br"),
        document.createTextNode(
          `${f("date").value} at ${f("time").value} · ${f("postcode").value.toUpperCase()} · ${photos.length} photo(s)`,
        ),
      );
    }
    panels[n].querySelector("h2").setAttribute("tabindex", "-1");
    panels[n].querySelector("h2").focus({ preventScroll: true });
  }
  form.querySelectorAll("[data-next]").forEach((b) =>
    b.addEventListener("click", () => {
      if (step === 0) {
        for (const field of panels[0].querySelectorAll("input,select,textarea"))
          if (!field.reportValidity()) return;
        if (!/^LE\d{1,2}\s?\d[A-Z]{2}$/i.test(f("postcode").value.trim()))
          return message("Please enter a Leicester (LE) postcode.");
      }
      if (step === 1 && (!f("date").value || !f("time").value))
        return message("Choose a preferred date and time.");
      show(step + 1);
    }),
  );
  form
    .querySelectorAll("[data-back]")
    .forEach((b) => b.addEventListener("click", () => show(step - 1)));
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  });
  async function loadDates() {
    const calendar = document.getElementById("calendar");
    calendar.textContent = "Loading visit windows…";
    message("");
    try {
      const iso = from.toISOString().slice(0, 10);
      const response = await fetch("/api/availability?from=" + iso);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      demo = data.demo;
      days = data.days;
      document.getElementById("date-range").textContent =
        formatter.format(new Date(days[0].date + "T12:00:00")) +
        " – " +
        formatter.format(new Date(days.at(-1).date + "T12:00:00"));
      calendar.replaceChildren();
      days.forEach((day) => {
        const date = new Date(day.date + "T12:00:00"),
          button = document.createElement("button");
        button.type = "button";
        button.className = "date-choice";
        button.disabled = !day.slots.length;
        button.setAttribute("aria-pressed", "false");
        button.setAttribute(
          "aria-label",
          new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(date) + (day.slots.length ? "" : " unavailable"),
        );
        const small = document.createElement("small");
        small.textContent = date.toLocaleDateString("en-GB", {
          weekday: "short",
        });
        button.append(small, document.createTextNode(String(date.getDate())));
        button.addEventListener("click", () => {
          f("date").value = day.date;
          f("time").value = "";
          calendar
            .querySelectorAll("button")
            .forEach((b) =>
              b.setAttribute("aria-pressed", String(b === button)),
            );
          renderTimes(day.slots);
        });
        calendar.append(button);
      });
      document.getElementById("dates-prev").disabled =
        from.getTime() < Date.now() + 2 * 86400000;
      document.getElementById("dates-next").disabled =
        from.getTime() > Date.now() + 55 * 86400000;
      f("date").value = "";
      f("time").value = "";
      document.getElementById("time-options").replaceChildren();
      if (!demo) {
        document.getElementById("demo-consent").hidden = true;
        f("demoConsent").required = false;
        document.getElementById("submit-booking").textContent =
          "Send visit request";
        document.querySelector(".booking-preview-note").hidden = true;
      }
    } catch (e) {
      calendar.textContent = "Visit windows could not be loaded.";
      message(e.message || "Please try again.");
    }
  }
  function renderTimes(times) {
    const box = document.getElementById("time-options");
    box.replaceChildren();
    times.forEach((time) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "time-choice";
      b.setAttribute("aria-pressed", "false");
      b.textContent =
        time +
        "–" +
        String(Number(time.slice(0, 2)) + 2).padStart(2, "0") +
        ":00";
      b.addEventListener("click", () => {
        f("time").value = time;
        box
          .querySelectorAll("button")
          .forEach((other) =>
            other.setAttribute("aria-pressed", String(other === b)),
          );
      });
      box.append(b);
    });
  }
  document.getElementById("dates-next").addEventListener("click", () => {
    from = new Date(from.getTime() + 28 * 86400000);
    loadDates();
  });
  document.getElementById("dates-prev").addEventListener("click", () => {
    from = new Date(
      Math.max(Date.now() + 86400000, from.getTime() - 28 * 86400000),
    );
    loadDates();
  });
  function renderPhotos() {
    const box = document.getElementById("photo-previews");
    box.replaceChildren();
    photos.forEach((file, index) => {
      const figure = document.createElement("figure"),
        img = document.createElement("img"),
        button = document.createElement("button");
      const url = URL.createObjectURL(file);
      img.src = url;
      img.alt = "Selected test garden photo " + (index + 1);
      img.onload = () => URL.revokeObjectURL(url);
      button.type = "button";
      button.textContent = "Remove photo " + (index + 1);
      button.addEventListener("click", () => {
        photos.splice(index, 1);
        renderPhotos();
      });
      figure.append(img, button);
      box.append(figure);
    });
  }
  async function reencode(file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error("Use JPEG, PNG or WebP photos.");
    if (file.size > 20000000)
      throw new Error("Please use a photo under 20 MB.");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.76),
    );
    if (!blob || blob.size > 1100000)
      throw new Error("Please choose a smaller photo.");
    return new File([blob], "garden-photo.jpg", { type: "image/jpeg" });
  }
  document
    .getElementById("garden-photos")
    .addEventListener("change", async (event) => {
      try {
        message("");
        const files = [...event.target.files];
        if (files.length + photos.length > 3)
          throw new Error("Add up to three photos.");
        for (const file of files) photos.push(await reencode(file));
        renderPhotos();
      } catch (e) {
        message(e.message);
      }
      event.target.value = "";
    });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = document.getElementById("submit-booking");
    button.disabled = true;
    button.textContent = "Saving your request…";
    message("");
    try {
      const data = new FormData(form);
      data.delete("photos");
      photos.forEach((file) => data.append("photos", file));
      data.set("requestId", requestId);
      const response = await fetch("/api/bookings", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Request could not be saved.");
      form.hidden = true;
      document.getElementById("booking-success").hidden = false;
      document.getElementById("booking-receipt").textContent =
        "Reference: " + result.reference;
      if (!result.demo) {
        document.querySelector("#booking-success h2").textContent =
          "Your request has been received.";
        document.querySelector("#booking-success p:last-of-type").textContent =
          "The team will review your request. Your appointment is not confirmed until they contact you.";
      }
      document
        .getElementById("booking-success")
        .scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "center",
        });
    } catch (e) {
      message(e.message);
    } finally {
      button.disabled = false;
      button.textContent = demo
        ? "Send test request"
        : "Send visit request";
    }
  });
  loadDates();
})();
