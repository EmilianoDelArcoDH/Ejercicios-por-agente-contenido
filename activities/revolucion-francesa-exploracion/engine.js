export function mountActivity(root, copy, report) {
  const s = copy.strings;

  // Data definitions
  const causes = [
    { id: 'c01', text: s.cause01Text, correct: 'economic' },
    { id: 'c02', text: s.cause02Text, correct: 'social' },
    { id: 'c03', text: s.cause03Text, correct: 'economic' },
    { id: 'c04', text: s.cause04Text, correct: 'social' },
    { id: 'c05', text: s.cause05Text, correct: 'political' },
    { id: 'c06', text: s.cause06Text, correct: 'political' },
    { id: 'c07', text: s.cause07Text, correct: 'political' },
    { id: 'c08', text: s.cause08Text, correct: 'political' },
    { id: 'c09', text: s.cause09Text, correct: 'economic' },
    { id: 'c10', text: s.cause10Text, correct: 'economic' }
  ];

  const events = [
    { id: 'e01', text: s.event01Text, year: 1789, order: 1 },
    { id: 'e02', text: s.event02Text, year: 1789, order: 2 },
    { id: 'e03', text: s.event03Text, year: 1789, order: 3 },
    { id: 'e04', text: s.event04Text, year: 1793, order: 4 },
    { id: 'e05', text: s.event05Text, year: 1794, order: 5 },
    { id: 'e06', text: s.event06Text, year: 1799, order: 6 }
  ];

  const characters = [
    { id: 'p01', name: s.character01Name, correctRole: 'r01' },
    { id: 'p02', name: s.character02Name, correctRole: 'r02' },
    { id: 'p03', name: s.character03Name, correctRole: 'r03' },
    { id: 'p04', name: s.character04Name, correctRole: 'r04' },
    { id: 'p05', name: s.character05Name, correctRole: 'r05' }
  ];

  const roles = [
    { id: 'r01', text: s.role01Text },
    { id: 'r02', text: s.role02Text },
    { id: 'r03', text: s.role03Text },
    { id: 'r04', text: s.role04Text },
    { id: 'r05', text: s.role05Text }
  ];

  const consequences = [
    { id: 'q01', text: s.consequence01Text, correct: true },
    { id: 'q02', text: s.consequence02Text, correct: true },
    { id: 'q03', text: s.consequence03Text, correct: true },
    { id: 'q04', text: s.consequence04Text, correct: true },
    { id: 'q05', text: s.consequence05Text, correct: false },
    { id: 'q06', text: s.consequence06Text, correct: false },
    { id: 'q07', text: s.consequence07Text, correct: false }
  ];

  // Shuffled initial order for timeline (predefined, not random)
  const timelineInitialOrder = ['e03', 'e06', 'e01', 'e05', 'e02', 'e04'];
  const correctTimelineOrder = ['e01', 'e02', 'e03', 'e04', 'e05', 'e06'];

  // Category label map
  const categoryLabels = {
    economic: s.categoryEconomicLabel,
    social: s.categorySocialLabel,
    political: s.categoryPoliticalLabel
  };

  // State
  let state = {};

  function initState() {
    state = {
      activeTab: 0,
      sections: [
        {
          // Section 1: causes
          placements: {}, // causeId -> category
          verified: false,
          passed: false
        },
        {
          // Section 2: timeline
          slots: [null, null, null, null, null, null], // slot index -> eventId
          verified: false,
          passed: false
        },
        {
          // Section 3: characters
          pairs: {}, // characterId -> roleId
          selectedCharacter: null,
          verified: false,
          passed: false
        },
        {
          // Section 4: consequences
          selected: {}, // consequenceId -> bool
          verified: false,
          passed: false
        }
      ]
    };
  }

  initState();

  // Build UI
  root.innerHTML = '';

  // Header
  const header = document.createElement('header');
  header.className = 'panel';
  const h1 = document.createElement('h1');
  h1.textContent = s.appTitle;
  header.appendChild(h1);
  const intro = document.createElement('p');
  intro.textContent = s.appIntroLine1 + ' ' + s.appIntroLine2;
  header.appendChild(intro);

  const resetBtn = document.createElement('button');
  resetBtn.textContent = s.resetButtonLabel;
  resetBtn.className = 'controls';
  resetBtn.setAttribute('aria-label', s.resetButtonLabel);
  resetBtn.style.cssText = 'background:#f3f4f6;color:#1a1a1a;border:1px solid #d1d5db;border-radius:6px;min-height:44px;min-width:120px;font-weight:600;cursor:pointer;padding:0 16px;';
  header.appendChild(resetBtn);
  root.appendChild(header);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.setAttribute('role', 'tablist');
  tabBar.className = 'controls';
  const tabLabels = [s.tab1Label, s.tab2Label, s.tab3Label, s.tab4Label];
  const tabBtns = [];
  tabLabels.forEach(function(label, i) {
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-controls', 'tabpanel-' + i);
    btn.id = 'tab-' + i;
    btn.textContent = label;
    btn.style.cssText = 'background:#f3f4f6;color:#1a1a1a;border:1px solid #d1d5db;border-radius:6px 6px 0 0;min-height:44px;min-width:100px;font-weight:600;cursor:pointer;padding:0 16px;margin-right:4px;';
    btn.addEventListener('click', function() { activateTab(i); });
    tabBtns.push(btn);
    tabBar.appendChild(btn);
  });
  root.appendChild(tabBar);

  // Tab panels
  const panels = [];
  for (let i = 0; i < 4; i++) {
    const panel = document.createElement('div');
    panel.setAttribute('role', 'tabpanel');
    panel.id = 'tabpanel-' + i;
    panel.setAttribute('aria-labelledby', 'tab-' + i);
    panel.className = 'panel';
    panel.hidden = i !== 0;
    panels.push(panel);
    root.appendChild(panel);
  }

  function activateTab(i) {
    state.activeTab = i;
    tabBtns.forEach(function(btn, idx) {
      btn.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      btn.style.background = idx === i ? '#2563eb' : '#f3f4f6';
      btn.style.color = idx === i ? '#ffffff' : '#1a1a1a';
    });
    panels.forEach(function(p, idx) { p.hidden = idx !== i; });
  }

  activateTab(0);

  // =====================
  // SECTION 1: CAUSES
  // =====================
  (function buildSection1() {
    const panel = panels[0];
    const h2 = document.createElement('h2');
    h2.textContent = s.section1Heading;
    panel.appendChild(h2);
    const ctx = document.createElement('p');
    ctx.textContent = s.section1ContextText;
    panel.appendChild(ctx);
    const instr = document.createElement('p');
    instr.textContent = s.section1Instruction;
    panel.appendChild(instr);

    // Source pool
    const poolLabel = document.createElement('p');
    poolLabel.textContent = s.causeSourcePoolLabel;
    poolLabel.style.fontWeight = '600';
    panel.appendChild(poolLabel);

    const pool = document.createElement('div');
    pool.className = 'grid';
    pool.setAttribute('data-visual-asset', 'causes-board');
    pool.setAttribute('aria-label', copy.accessibleNames[1]);
    pool.id = 'causes-pool';
    pool.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;min-height:60px;border:2px dashed #d1d5db;padding:8px;border-radius:6px;';
    panel.appendChild(pool);

    // Category columns
    const colsWrapper = document.createElement('div');
    colsWrapper.style.cssText = 'display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;';
    const categoryIds = ['economic', 'social', 'political'];
    const categoryEls = {};

    categoryIds.forEach(function(cat) {
      const col = document.createElement('div');
      col.style.cssText = 'flex:1;min-width:160px;border:2px solid #d1d5db;border-radius:6px;padding:8px;min-height:120px;';
      const colHead = document.createElement('h3');
      colHead.textContent = categoryLabels[cat];
      colHead.style.cssText = 'margin:0 0 8px 0;font-size:1em;';
      col.appendChild(colHead);
      const dropZone = document.createElement('div');
      dropZone.setAttribute('data-category', cat);
      dropZone.setAttribute('aria-label', categoryLabels[cat]);
      dropZone.style.cssText = 'min-height:80px;display:flex;flex-direction:column;gap:4px;';
      dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.style.background = '#eff6ff'; });
      dropZone.addEventListener('dragleave', function() { dropZone.style.background = ''; });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.style.background = '';
        const causeId = e.dataTransfer.getData('text/plain');
        if (!causeId) return;
        placeCauseCard(causeId, cat);
      });
      col.appendChild(dropZone);
      categoryEls[cat] = dropZone;
      colsWrapper.appendChild(col);
    });
    panel.appendChild(colsWrapper);

    // Verify button
    const verifyBtn = document.createElement('button');
    verifyBtn.textContent = s.section1VerifyButton;
    verifyBtn.className = 'controls';
    verifyBtn.disabled = true;
    verifyBtn.style.cssText = 'background:#2563eb;color:#ffffff;border:none;border-radius:6px;min-height:44px;min-width:120px;font-weight:600;cursor:pointer;padding:0 16px;margin-top:12px;';
    verifyBtn.setAttribute('aria-disabled', 'true');
    verifyBtn.setAttribute('title', s.verifyButtonDisabledHint);
    panel.appendChild(verifyBtn);

    // Feedback region
    const feedback = document.createElement('div');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-label', copy.accessibleNames[4]);
    feedback.setAttribute('data-visual-asset', 'feedback-region');
    feedback.className = 'feedback';
    feedback.style.marginTop = '12px';
    panel.appendChild(feedback);

    // Keyboard state for click-to-place
    let selectedCardId = null;

    function createCauseCard(cause) {
      const card = document.createElement('div');
      card.className = 'item';
      card.id = 'cause-card-' + cause.id;
      card.setAttribute('data-cause-id', cause.id);
      card.setAttribute('data-correct-category', cause.correct);
      card.setAttribute('draggable', 'true');
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-grabbed', 'false');
      card.setAttribute('aria-label', cause.text);
      card.textContent = cause.text;
      card.style.cssText = 'background:#f9fafb;border:2px solid #d1d5db;border-radius:6px;padding:8px;cursor:grab;font-size:0.9em;user-select:none;';

      card.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', cause.id);
        card.setAttribute('aria-grabbed', 'true');
      });
      card.addEventListener('dragend', function() {
        card.setAttribute('aria-grabbed', 'false');
      });

      // Click-to-select then click-to-place
      card.addEventListener('click', function() {
        if (selectedCardId === cause.id) {
          selectedCardId = null;
          card.style.outline = '';
        } else {
          selectedCardId = cause.id;
          // Deselect others
          pool.querySelectorAll('[data-cause-id]').forEach(function(c) { c.style.outline = ''; });
          Object.values(categoryEls).forEach(function(z) {
            z.querySelectorAll('[data-cause-id]').forEach(function(c) { c.style.outline = ''; });
          });
          card.style.outline = '2px solid #2563eb';
        }
      });

      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });

      return card;
    }

    // Click on category zone to place selected card
    categoryIds.forEach(function(cat) {
      const zone = categoryEls[cat];
      zone.addEventListener('click', function() {
        if (selectedCardId) {
          placeCauseCard(selectedCardId, cat);
          selectedCardId = null;
        }
      });
    });

    function placeCauseCard(causeId, cat) {
      // Remove from wherever it is
      const existing = document.getElementById('cause-card-' + causeId);
      if (existing) existing.remove();
      // Update state
      state.sections[0].placements[causeId] = cat;
      // Find cause data
      const cause = causes.find(function(c) { return c.id === causeId; });
      if (!cause) return;
      const card = createCauseCard(cause);
      categoryEls[cat].appendChild(card);
      // Enable verify
      updateVerifyBtn1();
    }

    function updateVerifyBtn1() {
      const hasAny = Object.keys(state.sections[0].placements).length > 0;
      verifyBtn.disabled = !hasAny;
      verifyBtn.setAttribute('aria-disabled', hasAny ? 'false' : 'true');
      verifyBtn.style.opacity = hasAny ? '1' : '0.5';
    }

    function renderPool() {
      pool.innerHTML = '';
      causes.forEach(function(cause) {
        if (!state.sections[0].placements[cause.id]) {
          pool.appendChild(createCauseCard(cause));
        }
      });
    }

    verifyBtn.addEventListener('click', function() {
      if (verifyBtn.disabled) return;
      let correct = 0;
      const results = [];
      causes.forEach(function(cause) {
        const placed = state.sections[0].placements[cause.id];
        const isCorrect = placed === cause.correct;
        if (isCorrect) correct++;
        results.push({ cause: cause, placed: placed, isCorrect: isCorrect });
      });
      const passed = correct >= 8;
      state.sections[0].verified = true;
      state.sections[0].passed = passed;

      // Apply visual feedback to cards
      results.forEach(function(r) {
        const card = document.getElementById('cause-card-' + r.cause.id);
        if (!card) return;
        if (r.placed) {
          card.style.background = r.isCorrect ? '#dcfce7' : '#fee2e2';
          card.style.borderColor = r.isCorrect ? '#16a34a' : '#dc2626';
          if (!r.isCorrect) {
            const hint = document.createElement('small');
            hint.textContent = s.section1CardCorrectHint.replace('{category}', categoryLabels[r.cause.correct]);
            hint.style.display = 'block';
            hint.style.color = '#dc2626';
            // Remove old hints
            card.querySelectorAll('small').forEach(function(el) { el.remove(); });
            card.appendChild(hint);
          }
        }
      });

      feedback.innerHTML = '';
      const countMsg = document.createElement('p');
      countMsg.textContent = s.section1FeedbackCorrectCount.replace('{count}', correct);
      feedback.appendChild(countMsg);
      const statusMsg = document.createElement('p');
      statusMsg.textContent = passed ? s.section1FeedbackPass : s.section1FeedbackFail;
      statusMsg.style.color = passed ? '#16a34a' : '#dc2626';
      statusMsg.style.fontWeight = '600';
      feedback.appendChild(statusMsg);

      updateTabStatus();
      checkAllPassed();
    });

    // Expose reset
    panel._reset = function() {
      state.sections[0].placements = {};
      state.sections[0].verified = false;
      state.sections[0].passed = false;
      selectedCardId = null;
      // Clear category zones
      categoryIds.forEach(function(cat) { categoryEls[cat].innerHTML = ''; });
      feedback.innerHTML = '';
      renderPool();
      updateVerifyBtn1();
    };

    renderPool();
  })();

  // =====================
  // SECTION 2: TIMELINE
  // =====================
  (function buildSection2() {
    const panel = panels[1];
    const h2 = document.createElement('h2');
    h2.textContent = s.section2Heading;
    panel.appendChild(h2);
    const ctx = document.createElement('p');
    ctx.textContent = s.section2ContextText;
    panel.appendChild(ctx);
    const instr = document.createElement('p');
    instr.textContent = s.section2Instruction;
    panel.appendChild(instr);

    // Event source pool
    const pool = document.createElement('div');
    pool.className = 'grid';
    pool.id = 'timeline-pool';
    pool.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;min-height:60px;border:2px dashed #d1d5db;padding:8px;border-radius:6px;margin-bottom:16px;';
    panel.appendChild(pool);

    // SVG timeline axis
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgWrapper = document.createElement('div');
    svgWrapper.setAttribute('data-visual-asset', 'timeline-axis');
    svgWrapper.setAttribute('aria-label', s.timelineAxisAriaLabel);
    svgWrapper.setAttribute('role', 'img');

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 700 60');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '60');
    svg.setAttribute('aria-hidden', 'true');

    // Axis line
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', '30'); line.setAttribute('y1', '30');
    line.setAttribute('x2', '670'); line.setAttribute('y2', '30');
    line.setAttribute('stroke', '#6b7280'); line.setAttribute('stroke-width', '2');
    svg.appendChild(line);

    const yearLabels = ['1789', '1789', '1789', '1793', '1794', '1799'];
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 108;
      const tick = document.createElementNS(svgNS, 'line');
      tick.setAttribute('x1', x); tick.setAttribute('y1', '24');
      tick.setAttribute('x2', x); tick.setAttribute('y2', '36');
      tick.setAttribute('stroke', '#6b7280'); tick.setAttribute('stroke-width', '2');
      svg.appendChild(tick);
      const numLabel = document.createElementNS(svgNS, 'text');
      numLabel.setAttribute('x', x); numLabel.setAttribute('y', '18');
      numLabel.setAttribute('text-anchor', 'middle');
      numLabel.setAttribute('font-size', '12');
      numLabel.setAttribute('fill', '#374151');
      numLabel.textContent = (i + 1) + ' (' + yearLabels[i] + ')';
      svg.appendChild(numLabel);
    }
    svgWrapper.appendChild(svg);
    panel.appendChild(svgWrapper);

    // Slot containers
    const slotsWrapper = document.createElement('div');
    slotsWrapper.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;';
    const slotEls = [];

    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = 'item';
      slot.setAttribute('data-slot-index', i);
      slot.setAttribute('aria-label', s.timelineSlotLabel.replace('{number}', i + 1));
      slot.style.cssText = 'flex:1;min-width:100px;min-height:80px;border:2px dashed #d1d5db;border-radius:6px;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:0.8em;color:#6b7280;';
      slot.textContent = (i + 1);

      slot.addEventListener('dragover', function(e) { e.preventDefault(); slot.style.background = '#eff6ff'; });
      slot.addEventListener('dragleave', function() { slot.style.background = ''; });
      slot.addEventListener('drop', function(e) {
        e.preventDefault();
        slot.style.background = '';
        const eventId = e.dataTransfer.getData('text/plain');
        if (!eventId) return;
        placeEventInSlot(eventId, i);
      });
      slot.addEventListener('click', function() {
        if (selectedEventId) {
          placeEventInSlot(selectedEventId, i);
          selectedEventId = null;
        }
      });

      slotEls.push(slot);
      slotsWrapper.appendChild(slot);
    }
    panel.appendChild(slotsWrapper);

    let selectedEventId = null;

    function createEventCard(ev) {
      const card = document.createElement('div');
      card.className = 'item';
      card.id = 'event-card-' + ev.id;
      card.setAttribute('data-event-id', ev.id);
      card.setAttribute('draggable', 'true');
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-grabbed', 'false');
      card.setAttribute('aria-label', ev.text);
      card.textContent = ev.text;
      card.style.cssText = 'background:#f9fafb;border:2px solid #d1d5db;border-radius:6px;padding:8px;cursor:grab;font-size:0.85em;user-select:none;';

      card.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', ev.id);
        card.setAttribute('aria-grabbed', 'true');
      });
      card.addEventListener('dragend', function() {
        card.setAttribute('aria-grabbed', 'false');
      });
      card.addEventListener('click', function() {
        if (selectedEventId === ev.id) {
          selectedEventId = null;
          card.style.outline = '';
        } else {
          selectedEventId = ev.id;
          clearEventSelectionHighlights();
          card.style.outline = '2px solid #2563eb';
        }
      });
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
      return card;
    }

    function clearEventSelectionHighlights() {
      pool.querySelectorAll('[data-event-id]').forEach(function(c) { c.style.outline = ''; });
      slotEls.forEach(function(sl) {
        sl.querySelectorAll('[data-event-id]').forEach(function(c) { c.style.outline = ''; });
      });
    }

    function placeEventInSlot(eventId, slotIndex) {
      // If slot already has an event, return it to pool
      const currentSlotEventId = state.sections[1].slots[slotIndex];
      if (currentSlotEventId) {
        state.sections[1].slots[slotIndex] = null;
        const oldCard = document.getElementById('event-card-' + currentSlotEventId);
        if (oldCard) oldCard.remove();
        const ev = events.find(function(e) { return e.id === currentSlotEventId; });
        if (ev) pool.appendChild(createEventCard(ev));
      }
      // Remove event from wherever it is
      const existingCard = document.getElementById('event-card-' + eventId);
      if (existingCard) {
        // Check if it was in a slot
        const oldSlotIndex = state.sections[1].slots.indexOf(eventId);
        if (oldSlotIndex >= 0) state.sections[1].slots[oldSlotIndex] = null;
        existingCard.remove();
      }
      state.sections[1].slots[slotIndex] = eventId;
      const ev = events.find(function(e) { return e.id === eventId; });
      if (!ev) return;
      const card = createEventCard(ev);
      // Clear slot label
      slotEls[slotIndex].textContent = '';
      slotEls[slotIndex].appendChild(card);
      updateVerifyBtn2();
    }

    function updateVerifyBtn2() {
      const hasAny = state.sections[1].slots.some(function(s) { return s !== null; });
      verifyBtn.disabled = !hasAny;
      verifyBtn.setAttribute('aria-disabled', hasAny ? 'false' : 'true');
      verifyBtn.style.opacity = hasAny ? '1' : '0.5';
    }

    const verifyBtn = document.createElement('button');
    verifyBtn.textContent = s.section2VerifyButton;
    verifyBtn.className = 'controls';
    verifyBtn.disabled = true;
    verifyBtn.style.cssText = 'background:#2563eb;color:#ffffff;border:none;border-radius:6px;min-height:44px;min-width:120px;font-weight:600;cursor:pointer;padding:0 16px;margin-top:12px;opacity:0.5;';
    verifyBtn.setAttribute('aria-disabled', 'true');
    panel.appendChild(verifyBtn);

    const feedback = document.createElement('div');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-label', copy.accessibleNames[5]);
    feedback.setAttribute('data-visual-asset', 'feedback-region');
    feedback.className = 'feedback';
    feedback.style.marginTop = '12px';
    panel.appendChild(feedback);

    verifyBtn.addEventListener('click', function() {
      if (verifyBtn.disabled) return;
      let allCorrect = true;
      state.sections[1].slots.forEach(function(eventId, idx) {
        const isCorrect = eventId === correctTimelineOrder[idx];
        if (!isCorrect) allCorrect = false;
        const card = eventId ? document.getElementById('event-card-' + eventId) : null;
        if (card) {
          card.style.background = isCorrect ? '#dcfce7' : '#fee2e2';
          card.style.borderColor = isCorrect ? '#16a34a' : '#dc2626';
          if (!isCorrect) {
            card.querySelectorAll('small').forEach(function(el) { el.remove(); });
            const hint = document.createElement('small');
            const correctEv = events.find(function(e) { return e.id === correctTimelineOrder[idx]; });
            hint.textContent = s.section2SlotCorrectYearHint + ' ' + (correctEv ? correctEv.year : '');
            hint.style.cssText = 'display:block;color:#dc2626;font-size:0.8em;';
            card.appendChild(hint);
          }
        }
      });
      state.sections[1].verified = true;
      state.sections[1].passed = allCorrect;
      feedback.innerHTML = '';
      const msg = document.createElement('p');
      msg.textContent = allCorrect ? s.section2FeedbackPass : s.section2FeedbackFail;
      msg.style.color = allCorrect ? '#16a34a' : '#dc2626';
      msg.style.fontWeight = '600';
      feedback.appendChild(msg);
      updateTabStatus();
      checkAllPassed();
    });

    function renderPool2() {
      pool.innerHTML = '';
      timelineInitialOrder.forEach(function(evId) {
        const ev = events.find(function(e) { return e.id === evId; });
        if (ev && !state.sections[1].slots.includes(ev.id)) {
          pool.appendChild(createEventCard(ev));
        }
      });
    }

    panel._reset = function() {
      state.sections[1].slots = [null, null, null, null, null, null];
      state.sections[1].verified = false;
      state.sections[1].passed = false;
      selectedEventId = null;
      slotEls.forEach(function(sl, i) {
        sl.innerHTML = '';
        sl.textContent = (i + 1);
        sl.style.background = '';
        sl.style.borderColor = '#d1d5db';
      });
      feedback.innerHTML = '';
      renderPool2();
      updateVerifyBtn2();
    };

    renderPool2();
  })();

  // =====================
  // SECTION 3: CHARACTERS
  // =====================
  (function buildSection3() {
    const panel = panels[2];
    const h2 = document.createElement('h2');
    h2.textContent = s.section3Heading;
    panel.appendChild(h2);
    const ctx = document.createElement('p');
    ctx.textContent = s.section3ContextText;
    panel.appendChild(ctx);
    const instr = document.createElement('p');
    instr.textContent = s.section3Instruction;
    panel.appendChild(instr);

    const colsWrapper = document.createElement('div');
    colsWrapper.setAttribute('data-visual-asset', 'characters-panel');
    colsWrapper.setAttribute('aria-label', copy.accessibleNames[2]);
    colsWrapper.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;';

    const charCol = document.createElement('div');
    charCol.style.cssText = 'flex:1;min-width:160px;';
    const charHead = document.createElement('h3');
    charHead.textContent = s.charactersColumnLabel;
    charCol.appendChild(charHead);

    const roleCol = document.createElement('div');
    roleCol.style.cssText = 'flex:2;min-width:200px;';
    const roleHead = document.createElement('h3');
    roleHead.textContent = s.rolesColumnLabel;
    roleCol.appendChild(roleHead);

    colsWrapper.appendChild(charCol);
    colsWrapper.appendChild(roleCol);
    panel.appendChild(colsWrapper);

    let selectedCharId = null;
    const charBtns = {};
    const roleBtns = {};

    // Pairs display area
    const pairsArea = document.createElement('div');
    pairsArea.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:6px;';
    panel.appendChild(pairsArea);

    function renderCharacters() {
      charCol.innerHTML = '';
      charCol.appendChild(charHead);
      characters.forEach(function(ch) {
        if (state.sections[2].pairs[ch.id]) return; // already paired
        const btn = document.createElement('button');
        btn.id = 'char-btn-' + ch.id;
        btn.textContent = ch.name;
        btn.className = 'item';
        btn.setAttribute('aria-pressed', 'false');
        btn.style.cssText = 'display:block;width:100%;text-align:left;background:#f9fafb;border:2px solid #d1d5db;border-radius:6px;padding:8px;margin-bottom:6px;cursor:pointer;font-size:0.9em;';
        btn.addEventListener('click', function() {
          if (selectedCharId === ch.id) {
            selectedCharId = null;
            btn.setAttribute('aria-pressed', 'false');
            btn.style.outline = '';
          } else {
            selectedCharId = ch.id;
            Object.values(charBtns).forEach(function(b) { b.setAttribute('aria-pressed', 'false'); b.style.outline = ''; });
            btn.setAttribute('aria-pressed', 'true');
            btn.style.outline = '2px solid #2563eb';
          }
        });
        charBtns[ch.id] = btn;
        charCol.appendChild(btn);
      });
    }

    function renderRoles() {
      roleCol.innerHTML = '';
      roleCol.appendChild(roleHead);
      // Show only unpaired roles
      const pairedRoles = Object.values(state.sections[2].pairs);
      roles.forEach(function(role) {
        if (pairedRoles.includes(role.id)) return;
        const btn = document.createElement('button');
        btn.id = 'role-btn-' + role.id;
        btn.textContent = role.text;
        btn.className = 'item';
        btn.style.cssText = 'display:block;width:100%;text-align:left;background:#f9fafb;border:2px solid #d1d5db;border-radius:6px;padding:8px;margin-bottom:6px;cursor:pointer;font-size:0.9em;';
        btn.addEventListener('click', function() {
          if (!selectedCharId) return;
          // Pair them
          state.sections[2].pairs[selectedCharId] = role.id;
          selectedCharId = null;
          renderCharacters();
          renderRoles();
          renderPairs();
          updateVerifyBtn3();
        });
        roleBtns[role.id] = btn;
        roleCol.appendChild(btn);
      });
    }

    function renderPairs() {
      pairsArea.innerHTML = '';
      Object.keys(state.sections[2].pairs).forEach(function(charId) {
        const roleId = state.sections[2].pairs[charId];
        const ch = characters.find(function(c) { return c.id === charId; });
        const role = roles.find(function(r) { return r.id === roleId; });
        if (!ch || !role) return;
        const row = document.createElement('div');
        row.id = 'pair-row-' + charId;
        row.style.cssText = 'display:flex;gap:8px;align-items:center;background:#f9fafb;border:2px solid #d1d5db;border-radius:6px;padding:8px;';
        const charSpan = document.createElement('strong');
        charSpan.textContent = ch.name;
        charSpan.style.minWidth = '140px';
        const arrow = document.createElement('span');
        arrow.textContent = '→';
        const roleSpan = document.createElement('span');
        roleSpan.textContent = role.text;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.setAttribute('aria-label', 'Quitar par ' + ch.name);
        removeBtn.style.cssText = 'background:#f3f4f6;color:#1a1a1a;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;margin-left:auto;padding:2px 8px;';
        removeBtn.addEventListener('click', function() {
          delete state.sections[2].pairs[charId];
          renderCharacters();
          renderRoles();
          renderPairs();
          updateVerifyBtn3();
        });
        row.appendChild(charSpan);
        row.appendChild(arrow);
        row.appendChild(roleSpan);
        row.appendChild(removeBtn);
        pairsArea.appendChild(row);
      });
    }

    function updateVerifyBtn3() {
      const hasAny = Object.keys(state.sections[2].pairs).length > 0;
      verifyBtn.disabled = !hasAny;
      verifyBtn.setAttribute('aria-disabled', hasAny ? 'false' : 'true');
      verifyBtn.style.opacity = hasAny ? '1' : '0.5';
    }

    const verifyBtn = document.createElement('button');
    verifyBtn.textContent = s.section3VerifyButton;
    verifyBtn.className = 'controls';
    verifyBtn.disabled = true;
    verifyBtn.style.cssText = 'background:#2563eb;color:#ffffff;border:none;border-radius:6px;min-height:44px;min-width:120px;font-weight:600;cursor:pointer;padding:0 16px;margin-top:12px;opacity:0.5;';
    verifyBtn.setAttribute('aria-disabled', 'true');
    panel.appendChild(verifyBtn);

    const feedback = document.createElement('div');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-label', copy.accessibleNames[6]);
    feedback.setAttribute('data-visual-asset', 'feedback-region');
    feedback.className = 'feedback';
    feedback.style.marginTop = '12px';
    panel.appendChild(feedback);

    verifyBtn.addEventListener('click', function() {
      if (verifyBtn.disabled) return;
      let allCorrect = true;
      characters.forEach(function(ch) {
        const selectedRole = state.sections[2].pairs[ch.id];
        const isCorrect = selectedRole === ch.correctRole;
        if (!isCorrect) allCorrect = false;
        const row = document.getElementById('pair-row-' + ch.id);
        if (row) {
          row.style.background = isCorrect ? '#dcfce7' : '#fee2e2';
          row.style.borderColor = isCorrect ? '#16a34a' : '#dc2626';
          if (!isCorrect) {
            row.querySelectorAll('.correct-hint').forEach(function(el) { el.remove(); });
            const hint = document.createElement('small');
            hint.className = 'correct-hint';
            const correctRole = roles.find(function(r) { return r.id === ch.correctRole; });
            hint.textContent = s.section3PairCorrectRoleHint + ' ' + (correctRole ? correctRole.text : '');
            hint.style.cssText = 'display:block;color:#dc2626;font-size:0.8em;margin-top:4px;';
            row.appendChild(hint);
          }
        }
      });
      state.sections[2].verified = true;
      state.sections[2].passed = allCorrect;
      feedback.innerHTML = '';
      const msg = document.createElement('p');
      msg.textContent = allCorrect ? s.section3FeedbackPass : s.section3FeedbackFail;
      msg.style.color = allCorrect ? '#16a34a' : '#dc2626';
      msg.style.fontWeight = '600';
      feedback.appendChild(msg);
      updateTabStatus();
      checkAllPassed();
    });

    panel._reset = function() {
      state.sections[2].pairs = {};
      state.sections[2].verified = false;
      state.sections[2].passed = false;
      selectedCharId = null;
      pairsArea.innerHTML = '';
      feedback.innerHTML = '';
      renderCharacters();
      renderRoles();
      updateVerifyBtn3();
    };

    renderCharacters();
    renderRoles();
  })();

  // ========================
  // SECTION 4: CONSEQUENCES
  // ========================
  (function buildSection4() {
    const panel = panels[3];
    const h2 = document.createElement('h2');
    h2.textContent = s.section4Heading;
    panel.appendChild(h2);
    const ctx = document.createElement('p');
    ctx.textContent = s.section4ContextText;
    panel.appendChild(ctx);
    const instr = document.createElement('p');
    instr.textContent = s.section4Instruction;
    panel.appendChild(instr);

    const ul = document.createElement('ul');
    ul.setAttribute('data-visual-asset', 'consequences-list');
    ul.setAttribute('aria-label', s.consequencesListAriaLabel);
    ul.className = 'grid';
    ul.style.cssText = 'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;';

    consequences.forEach(function(item) {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:flex-start;gap:8px;background:#f9fafb;border:2px solid #d1d5db;border-radius:6px;padding:10px;';
      li.id = 'cons-item-' + item.id;
      li.setAttribute('data-correct', item.correct ? 'true' : 'false');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'cons-check-' + item.id;
      checkbox.setAttribute('aria-label', item.text);
      checkbox.style.cssText = 'margin-top:2px;width:18px;height:18px;cursor:pointer;flex-shrink:0;';
      checkbox.addEventListener('change', function() {
        state.sections[3].selected[item.id] = checkbox.checked;
        updateVerifyBtn4();
      });

      const label = document.createElement('label');
      label.setAttribute('for', 'cons-check-' + item.id);
      label.textContent = item.text;
      label.style.cssText = 'cursor:pointer;font-size:0.9em;';

      li.appendChild(checkbox);
      li.appendChild(label);
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    function updateVerifyBtn4() {
      const hasAny = Object.values(state.sections[3].selected).some(function(v) { return v; });
      verifyBtn.disabled = !hasAny;
      verifyBtn.setAttribute('aria-disabled', hasAny ? 'false' : 'true');
      verifyBtn.style.opacity = hasAny ? '1' : '0.5';
    }

    const verifyBtn = document.createElement('button');
    verifyBtn.textContent = s.section4VerifyButton;
    verifyBtn.className = 'controls';
    verifyBtn.disabled = true;
    verifyBtn.style.cssText = 'background:#2563eb;color:#ffffff;border:none;border-radius:6px;min-height:44px;min-width:120px;font-weight:600;cursor:pointer;padding:0 16px;margin-top:12px;opacity:0.5;';
    verifyBtn.setAttribute('aria-disabled', 'true');
    panel.appendChild(verifyBtn);

    const feedback = document.createElement('div');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-label', copy.accessibleNames[7]);
    feedback.setAttribute('data-visual-asset', 'feedback-region');
    feedback.className = 'feedback';
    feedback.style.marginTop = '12px';
    panel.appendChild(feedback);

    verifyBtn.addEventListener('click', function() {
      if (verifyBtn.disabled) return;
      let correctSelected = 0;
      let wrongSelected = 0;
      consequences.forEach(function(item) {
        const isSelected = !!state.sections[3].selected[item.id];
        const li = document.getElementById('cons-item-' + item.id);
        if (!li) return;
        li.querySelectorAll('small').forEach(function(el) { el.remove(); });
        if (isSelected) {
          if (item.correct) {
            correctSelected++;
            li.style.background = '#dcfce7';
            li.style.borderColor = '#16a34a';
          } else {
            wrongSelected++;
            li.style.background = '#fee2e2';
            li.style.borderColor = '#dc2626';
          }
        } else {
          if (item.correct) {
            li.style.background = '#fefce8';
            li.style.borderColor = '#ca8a04';
            const hint = document.createElement('small');
            hint.textContent = s.section4UncheckedCorrectHint;
            hint.style.cssText = 'display:block;color:#ca8a04;font-size:0.8em;margin-top:4px;';
            li.appendChild(hint);
          } else {
            li.style.background = '#f9fafb';
            li.style.borderColor = '#d1d5db';
          }
        }
      });
      const passed = correctSelected >= 3 && wrongSelected <= 1;
      state.sections[3].verified = true;
      state.sections[3].passed = passed;
      feedback.innerHTML = '';
      const msg = document.createElement('p');
      msg.textContent = passed ? s.section4FeedbackPass : s.section4FeedbackFail;
      msg.style.color = passed ? '#16a34a' : '#dc2626';
      msg.style.fontWeight = '600';
      feedback.appendChild(msg);
      updateTabStatus();
      checkAllPassed();
    });

    panel._reset = function() {
      state.sections[3].selected = {};
      state.sections[3].verified = false;
      state.sections[3].passed = false;
      ul.querySelectorAll('input[type=checkbox]').forEach(function(cb) { cb.checked = false; });
      ul.querySelectorAll('li').forEach(function(li) {
        li.style.background = '#f9fafb';
        li.style.borderColor = '#d1d5db';
        li.querySelectorAll('small').forEach(function(el) { el.remove(); });
      });
      feedback.innerHTML = '';
      updateVerifyBtn4();
    };
  })();

  // Tab status indicators
  function updateTabStatus() {
    tabBtns.forEach(function(btn, i) {
      const sec = state.sections[i];
      const label = tabLabels[i];
      if (sec.passed) {
        btn.textContent = label + ' ✓';
      } else {
        btn.textContent = label;
      }
    });
  }

  function checkAllPassed() {
    const allPassed = state.sections.every(function(sec) { return sec.passed; });
    if (allPassed) {
      report('success');
    }
  }

  // Reset handler
  resetBtn.addEventListener('click', function() {
    if (!window.confirm(s.resetConfirmMessage)) return;
    initState();
    panels.forEach(function(p) {
      if (p._reset) p._reset();
    });
    updateTabStatus();
    activateTab(0);
    report('failure');
  });
}