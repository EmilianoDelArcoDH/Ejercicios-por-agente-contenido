export function mountActivity(root, copy, report) {
  const s = copy.strings;

  // Answer key
  const ANSWER_KEY = {
    'formulario-carga': 'presentacion',
    'validacion-campos': 'logica',
    'repositorio-tareas': 'datos',
    'controlador-tareas': 'logica',
    'modelo-tarea': 'datos',
    'servicio-tareas': 'logica'
  };

  const CARD_IDS = Object.keys(ANSWER_KEY);

  const CARD_LABELS = {
    'formulario-carga': s.cardFormulario,
    'validacion-campos': s.cardValidacion,
    'repositorio-tareas': s.cardRepositorio,
    'controlador-tareas': s.cardControlador,
    'modelo-tarea': s.cardModelo,
    'servicio-tareas': s.cardServicio
  };

  const ZONE_IDS = ['presentacion', 'logica', 'datos'];

  const ZONE_LABELS = {
    'presentacion': s.zonePresentationLabel,
    'logica': s.zoneLogicLabel,
    'datos': s.zoneDataLabel
  };

  const ZONE_JUSTIFICATION_LABELS = {
    'presentacion': s.justificationLabelPresentation,
    'logica': s.justificationLabelLogic,
    'datos': s.justificationLabelData
  };

  const ZONE_JUSTIFICATION_PLACEHOLDERS = {
    'presentacion': s.justificationPlaceholderPresentation,
    'logica': s.justificationPlaceholderLogic,
    'datos': s.justificationPlaceholderData
  };

  // State
  let assignments = {};
  CARD_IDS.forEach(id => { assignments[id] = null; });
  let justifications = { 'presentacion': '', 'logica': '', 'datos': '' };
  let attemptCount = 0;
  let lastCheckResult = null;
  let movedSinceLastCheck = false;
  let phase = 'idle';
  let draggedCard = null;
  let keyboardPickedCard = null;

  // DOM references
  const cardElements = {};
  const zoneDropAreas = {};
  const justificationTextareas = {};
  const justificationWarnings = {};
  let stagingArea = null;
  let feedbackRegion = null;
  let checkButton = null;
  let resetButton = null;
  let attemptCounter = null;
  let moveWarning = null;

  function buildUI() {
    root.innerHTML = '';

    // Title
    const titleEl = document.createElement('h2');
    titleEl.className = 'panel';
    titleEl.textContent = copy.title;
    root.appendChild(titleEl);

    // Requirement panel
    const reqPanel = document.createElement('div');
    reqPanel.className = 'panel';
    const reqLabel = document.createElement('strong');
    reqLabel.textContent = s.requirementLabel + ': ';
    reqPanel.appendChild(reqLabel);
    const reqText = document.createElement('span');
    reqText.textContent = s.requirementText;
    reqPanel.appendChild(reqText);
    root.appendChild(reqPanel);

    // Instructions
    const instrPanel = document.createElement('div');
    instrPanel.className = 'panel';
    const instr1 = document.createElement('p');
    instr1.textContent = s.instructionDragCards;
    instrPanel.appendChild(instr1);
    const instr2 = document.createElement('p');
    instr2.textContent = s.instructionWriteJustification;
    instrPanel.appendChild(instr2);
    root.appendChild(instrPanel);

    // Main layout: staging area + diagram
    const mainGrid = document.createElement('div');
    mainGrid.className = 'grid';
    root.appendChild(mainGrid);

    // Staging area
    const stagingPanel = document.createElement('div');
    stagingPanel.className = 'panel';
    const stagingLabel = document.createElement('h3');
    stagingLabel.textContent = s.stagingAreaLabel;
    stagingPanel.appendChild(stagingLabel);

    stagingArea = document.createElement('div');
    stagingArea.className = 'simulation-scene';
    stagingArea.setAttribute('role', 'list');
    stagingArea.setAttribute('aria-label', s.stagingAreaLabel);
    stagingArea.dataset.zone = 'staging';
    setupDropTarget(stagingArea, 'staging');
    stagingPanel.appendChild(stagingArea);
    mainGrid.appendChild(stagingPanel);

    // Create cards
    CARD_IDS.forEach(cardId => {
      const card = createCard(cardId);
      cardElements[cardId] = card;
      stagingArea.appendChild(card);
    });

    // Diagram panel
    const diagramPanel = document.createElement('div');
    diagramPanel.className = 'panel';
    const diagramLabel = document.createElement('h3');
    diagramLabel.textContent = copy.title;
    diagramPanel.appendChild(diagramLabel);

    // SVG architecture diagram background
    ZONE_IDS.forEach((zoneId, idx) => {
      const zoneWrapper = document.createElement('div');
      zoneWrapper.className = 'panel item';
      zoneWrapper.setAttribute('data-visual-asset', 'zona-' + zoneId);
      zoneWrapper.setAttribute('aria-label', copy.accessibleNames[idx]);

      // Inline SVG visual asset for the zone
      const zoneSvgId = 'zona-' + zoneId;
      const zoneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      zoneSvg.setAttribute('data-visual-asset', zoneSvgId);
      zoneSvg.setAttribute('aria-label', copy.accessibleNames[idx]);
      zoneSvg.setAttribute('role', 'img');
      zoneSvg.setAttribute('width', '100%');
      zoneSvg.setAttribute('height', '8');
      zoneSvg.style.display = 'block';
      const zoneSvgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      zoneSvgRect.setAttribute('width', '100%');
      zoneSvgRect.setAttribute('height', '8');
      zoneSvgRect.setAttribute('rx', '3');
      zoneSvgRect.setAttribute('fill', idx === 0 ? '#a8d8ea' : idx === 1 ? '#a8e6cf' : '#ffd3b6');
      zoneSvg.appendChild(zoneSvgRect);
      zoneWrapper.appendChild(zoneSvg);

      const zoneHeader = document.createElement('div');
      zoneHeader.className = 'status';
      const zoneTitle = document.createElement('strong');
      zoneTitle.textContent = ZONE_LABELS[zoneId];
      zoneHeader.appendChild(zoneTitle);
      zoneWrapper.appendChild(zoneHeader);

      // Drop area
      const dropArea = document.createElement('div');
      dropArea.className = 'simulation-scene';
      dropArea.setAttribute('role', 'list');
      dropArea.setAttribute('aria-label', ZONE_LABELS[zoneId]);
      dropArea.dataset.zone = zoneId;
      dropArea.setAttribute('tabindex', '0');
      dropArea.setAttribute('aria-label', copy.accessibleNames[idx] + '. ' + s.zoneDropTargetHint);
      setupDropTarget(dropArea, zoneId);

      // Keyboard drop support
      dropArea.addEventListener('keydown', function(e) {
        if ((e.key === ' ' || e.key === 'Enter') && keyboardPickedCard) {
          e.preventDefault();
          dropCardToZone(keyboardPickedCard, zoneId);
          announce(s.cardDroppedAnnouncement
            .replace('{cardName}', CARD_LABELS[keyboardPickedCard])
            .replace('{zoneName}', ZONE_LABELS[zoneId]));
          keyboardPickedCard = null;
          updateUI();
        }
      });

      zoneDropAreas[zoneId] = dropArea;
      zoneWrapper.appendChild(dropArea);

      // Justification
      const justLabel = document.createElement('label');
      justLabel.textContent = ZONE_JUSTIFICATION_LABELS[zoneId];
      justLabel.setAttribute('for', 'just-' + zoneId);
      zoneWrapper.appendChild(justLabel);

      const textarea = document.createElement('textarea');
      textarea.id = 'just-' + zoneId;
      textarea.className = 'item';
      textarea.setAttribute('rows', '3');
      textarea.setAttribute('placeholder', ZONE_JUSTIFICATION_PLACEHOLDERS[zoneId]);
      textarea.value = justifications[zoneId];
      textarea.addEventListener('input', function() {
        justifications[zoneId] = textarea.value;
        updateUI();
      });
      justificationTextareas[zoneId] = textarea;
      zoneWrapper.appendChild(textarea);

      const warning = document.createElement('span');
      warning.className = 'feedback';
      warning.setAttribute('aria-live', 'polite');
      warning.style.display = 'none';
      warning.textContent = s.justificationTooShortWarning;
      justificationWarnings[zoneId] = warning;
      zoneWrapper.appendChild(warning);

      diagramPanel.appendChild(zoneWrapper);
    });

    mainGrid.appendChild(diagramPanel);

    // Controls
    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'controls';

    attemptCounter = document.createElement('span');
    attemptCounter.className = 'status';
    attemptCounter.textContent = s.attemptCounterLabel.replace('{count}', attemptCount);
    controlsPanel.appendChild(attemptCounter);

    moveWarning = document.createElement('span');
    moveWarning.className = 'feedback';
    moveWarning.setAttribute('aria-live', 'polite');
    moveWarning.style.display = 'none';
    moveWarning.textContent = s.feedbackMoveCardWarning;
    controlsPanel.appendChild(moveWarning);

    checkButton = document.createElement('button');
    checkButton.className = 'item';
    checkButton.textContent = s.checkButtonLabel;
    checkButton.setAttribute('aria-label', s.checkButtonLabel);
    checkButton.disabled = true;
    checkButton.addEventListener('click', handleCheck);
    controlsPanel.appendChild(checkButton);

    resetButton = document.createElement('button');
    resetButton.className = 'item';
    resetButton.textContent = s.resetButtonLabel;
    resetButton.setAttribute('aria-label', s.resetButtonLabel);
    resetButton.addEventListener('click', handleReset);
    controlsPanel.appendChild(resetButton);

    root.appendChild(controlsPanel);

    // Feedback region
    feedbackRegion = document.createElement('div');
    feedbackRegion.className = 'feedback panel';
    feedbackRegion.setAttribute('role', 'alert');
    feedbackRegion.setAttribute('aria-live', 'assertive');
    feedbackRegion.setAttribute('aria-label', s.feedbackRegionAriaLabel);
    feedbackRegion.style.display = 'none';
    root.appendChild(feedbackRegion);

    // Hints
    const hintsPanel = document.createElement('div');
    hintsPanel.className = 'panel';
    const hintsList = document.createElement('ul');
    [s.hint1, s.hint2, s.hint3].forEach(hint => {
      const li = document.createElement('li');
      li.textContent = hint;
      hintsList.appendChild(li);
    });
    hintsPanel.appendChild(hintsList);
    root.appendChild(hintsPanel);

    // Live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'status';
    liveRegion.id = 'live-announce';
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-9999px';
    root.appendChild(liveRegion);
  }

  function announce(msg) {
    const el = root.querySelector('#live-announce');
    if (el) {
      el.textContent = '';
      setTimeout(() => { el.textContent = msg; }, 50);
    }
  }

  function createCard(cardId) {
    const card = document.createElement('div');
    card.className = 'item';
    card.setAttribute('role', 'listitem');
    card.setAttribute('draggable', 'true');
    card.setAttribute('tabindex', '0');
    card.dataset.cardId = cardId;
    card.setAttribute('data-visual-asset', 'tarjetas-componentes');
    card.setAttribute('aria-label', CARD_LABELS[cardId]);

    // Inline SVG visual asset for the card (approved asset: tarjetas-componentes)
    const cardSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    cardSvg.setAttribute('data-visual-asset', 'tarjetas-componentes');
    cardSvg.setAttribute('aria-label', copy.accessibleNames[3]);
    cardSvg.setAttribute('role', 'img');
    cardSvg.setAttribute('width', '100%');
    cardSvg.setAttribute('height', '6');
    cardSvg.style.display = 'block';
    const cardSvgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    cardSvgRect.setAttribute('width', '100%');
    cardSvgRect.setAttribute('height', '6');
    cardSvgRect.setAttribute('rx', '3');
    cardSvgRect.setAttribute('fill', '#e0c8f0');
    cardSvg.appendChild(cardSvgRect);
    card.appendChild(cardSvg);

    const cardLabel = document.createElement('span');
    cardLabel.textContent = CARD_LABELS[cardId];
    card.appendChild(cardLabel);

    card.addEventListener('dragstart', function(e) {
      draggedCard = cardId;
      e.dataTransfer.setData('text/plain', cardId);
      card.classList.add('sim-motion');
    });

    card.addEventListener('dragend', function() {
      card.classList.remove('sim-motion');
      draggedCard = null;
    });

    card.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (keyboardPickedCard === cardId) {
          // Drop back to staging
          dropCardToZone(cardId, 'staging');
          announce(s.cardReturnedAnnouncement.replace('{cardName}', CARD_LABELS[cardId]));
          keyboardPickedCard = null;
          updateUI();
        } else {
          keyboardPickedCard = cardId;
          announce(s.cardPickedUpAnnouncement.replace('{cardName}', CARD_LABELS[cardId]));
        }
      }
    });

    return card;
  }

  function setupDropTarget(el, zoneId) {
    el.addEventListener('dragover', function(e) {
      e.preventDefault();
      el.classList.add('sim-flow');
    });

    el.addEventListener('dragleave', function() {
      el.classList.remove('sim-flow');
    });

    el.addEventListener('drop', function(e) {
      e.preventDefault();
      el.classList.remove('sim-flow');
      const cardId = e.dataTransfer.getData('text/plain');
      if (cardId && CARD_IDS.includes(cardId)) {
        dropCardToZone(cardId, zoneId);
        updateUI();
      }
    });
  }

  function dropCardToZone(cardId, zoneId) {
    const card = cardElements[cardId];
    if (!card) return;

    // Remove result indicators
    card.classList.remove('sim-paused', 'sim-motion');
    card.removeAttribute('data-result');

    if (zoneId === 'staging') {
      assignments[cardId] = null;
      stagingArea.appendChild(card);
    } else {
      assignments[cardId] = zoneId;
      zoneDropAreas[zoneId].appendChild(card);
    }

    if (phase === 'checked-fail') {
      movedSinceLastCheck = true;
    }
  }

  function isAllAssigned() {
    return CARD_IDS.every(id => assignments[id] !== null);
  }

  function isJustificationsValid() {
    return ZONE_IDS.every(zoneId => justifications[zoneId].trim().length >= 10);
  }

  function isCheckEnabled() {
    if (!isAllAssigned()) return false;
    if (!isJustificationsValid()) return false;
    if (phase === 'checked-fail' && !movedSinceLastCheck) return false;
    return true;
  }

  function updateUI() {
    // Update check button
    const enabled = isCheckEnabled();
    checkButton.disabled = !enabled;
    checkButton.title = enabled ? '' : s.checkButtonDisabledHint;

    // Show/hide move warning
    if (phase === 'checked-fail' && isAllAssigned() && isJustificationsValid() && !movedSinceLastCheck) {
      moveWarning.style.display = '';
    } else {
      moveWarning.style.display = 'none';
    }

    // Show justification warnings
    ZONE_IDS.forEach(zoneId => {
      const trimmed = justifications[zoneId].trim();
      const warn = justificationWarnings[zoneId];
      if (trimmed.length > 0 && trimmed.length < 10) {
        warn.style.display = '';
      } else {
        warn.style.display = 'none';
      }
    });

    // Update attempt counter
    attemptCounter.textContent = s.attemptCounterLabel.replace('{count}', attemptCount);
  }

  function handleCheck() {
    if (!isCheckEnabled()) {
      if (phase === 'checked-fail' && !movedSinceLastCheck) {
        moveWarning.style.display = '';
      }
      return;
    }

    attemptCount++;
    movedSinceLastCheck = false;

    // Evaluate
    let score = 0;
    const misplaced = [];
    CARD_IDS.forEach(cardId => {
      if (assignments[cardId] === ANSWER_KEY[cardId]) {
        score++;
      } else {
        misplaced.push(cardId);
      }
    });

    lastCheckResult = { score, misplaced };

    // Apply visual indicators to cards
    CARD_IDS.forEach(cardId => {
      const card = cardElements[cardId];
      card.classList.remove('sim-paused', 'sim-motion');
      if (assignments[cardId] === ANSWER_KEY[cardId]) {
        card.classList.add('sim-motion');
        card.setAttribute('aria-label', CARD_LABELS[cardId] + ' - ' + s.cardCorrectIndicatorLabel);
      } else {
        card.classList.add('sim-paused');
        card.setAttribute('aria-label', CARD_LABELS[cardId] + ' - ' + s.cardIncorrectIndicatorLabel);
      }
    });

    const passed = score >= 5;

    if (passed) {
      phase = 'checked-pass';
      showFeedback(true, score, misplaced);
      report('success');
    } else {
      phase = 'checked-fail';
      showFeedback(false, score, misplaced);
    }

    updateUI();
  }

  function showFeedback(passed, score, misplaced) {
    feedbackRegion.style.display = '';
    feedbackRegion.innerHTML = '';

    let msg = '';
    if (passed) {
      if (score === 6) {
        msg = s.feedbackSuccess6;
      } else {
        const cardName = CARD_LABELS[misplaced[0]];
        msg = s.feedbackSuccess5.replace('{cardName}', cardName);
      }
    } else {
      const count = misplaced.length;
      const cardList = misplaced.map(id => CARD_LABELS[id]).join(', ');
      msg = s.feedbackFailBelow5
        .replace('{count}', count)
        .replace('{cardList}', cardList);
    }

    const msgEl = document.createElement('p');
    msgEl.textContent = msg;
    feedbackRegion.appendChild(msgEl);

    if (!passed) {
      const encourageEl = document.createElement('p');
      encourageEl.textContent = s.feedbackEncouragement;
      feedbackRegion.appendChild(encourageEl);
    }
  }

  function handleReset() {
    // Reset state
    CARD_IDS.forEach(id => { assignments[id] = null; });
    justifications = { 'presentacion': '', 'logica': '', 'datos': '' };
    attemptCount = 0;
    lastCheckResult = null;
    movedSinceLastCheck = false;
    phase = 'idle';
    draggedCard = null;
    keyboardPickedCard = null;

    // Move all cards back to staging
    CARD_IDS.forEach(cardId => {
      const card = cardElements[cardId];
      card.classList.remove('sim-paused', 'sim-motion');
      card.removeAttribute('data-result');
      card.setAttribute('aria-label', CARD_LABELS[cardId]);
      stagingArea.appendChild(card);
    });

    // Clear justification textareas
    ZONE_IDS.forEach(zoneId => {
      justificationTextareas[zoneId].value = '';
      justificationWarnings[zoneId].style.display = 'none';
    });

    // Clear feedback
    feedbackRegion.style.display = 'none';
    feedbackRegion.innerHTML = '';

    moveWarning.style.display = 'none';

    report('failure');
    updateUI();
  }

  buildUI();
  updateUI();
}