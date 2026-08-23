const ttsButton = document.getElementById("tts");
const summaryText =
  "Sammendrag. Neste frist: svar på nabovarsel innen 10 dager. Eiendomsskatt: 6 420 kroner, betalt 12. februar. To eiere registrert. Bruksareal 146 kvadratmeter. Kontaktpunkt: byggesak 38 07 50 00.";

if ("speechSynthesis" in window && ttsButton) {
  ttsButton.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(summaryText);
    utter.lang = "no-NO";
    window.speechSynthesis.speak(utter);
  });
} else if (ttsButton) {
  ttsButton.textContent = "Les opp (ikke tilgjengelig i nettleser)";
  ttsButton.classList.add("disabled");
  ttsButton.setAttribute("disabled", "disabled");
}

const contextBox = document.getElementById("contextBox");
const contextContent = {
  garasje:
    "Du kan bygge inntil 50 m² uten søknad dersom avstand til nabo er over 1 meter.",
  basseng:
    "Basseng krever avklaring om sikkerhet og plassering. Vi sjekker automatisk avstand til vei og nabo.",
  fasade:
    "Endring av fasade kan være søknadspliktig. Vi ser på vernestatus og reguleringsplan for deg."
};

document.querySelectorAll("input[name='tiltak']").forEach((radio) => {
  radio.addEventListener("change", (event) => {
    const key = event.target.value;
    contextBox.innerHTML =
      "<strong>" +
      event.target.parentElement.textContent.trim() +
      "</strong><br>" +
      contextContent[key];
  });
});

const propertySelect = document.getElementById("property");
const propertyName = document.getElementById("propertyName");
const municipalityNote = document.getElementById("municipalityNote");

if (propertySelect && propertyName && municipalityNote) {
  propertySelect.addEventListener("change", (event) => {
    const option = event.target.selectedOptions[0];
    propertyName.textContent = option.value.split(",")[0];
    municipalityNote.textContent =
      "Regler og dokumenter vises for " + option.dataset.municipality + ".";
  });
}

const mapTabs = document.querySelectorAll(".map-toolbar .chip");
const mapPanels = document.querySelectorAll(".map-panel");

mapTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.map;
    mapTabs.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    });
    mapPanels.forEach((panel) => {
      panel.classList.remove("active");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    const activePanel = document.getElementById("map-" + target);
    if (activePanel) {
      activePanel.classList.add("active");
    }
  });
});

const navLinks = Array.from(document.querySelectorAll("nav a[href^='#']"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const setActiveLink = (id) => {
  navLinks.forEach((link) => {
    const target = link.getAttribute("href").slice(1);
    link.classList.toggle("active", target === id);
  });
};

if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        setActiveLink(visible.target.id);
      }
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: [0.2, 0.4, 0.6] }
  );

  sections.forEach((section) => observer.observe(section));
} else {
  const fallbackId = sections[0] ? sections[0].id : null;
  if (fallbackId) {
    setActiveLink(fallbackId);
  }
}
