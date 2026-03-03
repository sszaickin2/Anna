import { b as bodyLock, a as bodyUnlock, c as bodyLockStatus, i as isMobile, g as gotoBlock, d as getHash } from "./common.min.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class Popup {
  constructor(options) {
    let config = {
      logging: true,
      init: true,
      // Для кнопок
      attributeOpenButton: "data-fls-popup-link",
      // Атрибут для кнопки, которая вызывает попап
      attributeCloseButton: "data-fls-popup-close",
      // Атрибут для кнопки, которая закрывает попап
      // Для сторонних объектов
      fixElementSelector: "[data-fls-lp]",
      // Атрибут для элементов с левым паддингом (которые fixed)
      // Для объекта попапа
      attributeMain: "data-fls-popup",
      youtubeAttribute: "data-fls-popup-youtube",
      // Атрибут для кода youtube
      youtubePlaceAttribute: "data-fls-popup-youtube-place",
      // Атрибут для вставки ролика youtube
      setAutoplayYoutube: true,
      // Изменение классов
      classes: {
        popup: "popup",
        // popupWrapper: 'popup__wrapper',
        popupContent: "data-fls-popup-body",
        popupActive: "data-fls-popup-active",
        // Добавляется для попапа, когда он открывается
        bodyActive: "data-fls-popup-open"
        // Добавляется для body, когда попап открыт
      },
      focusCatch: true,
      // Фокус внутри попапа зациклен
      closeEsc: true,
      // Закрытие ESC
      bodyLock: true,
      // Блокировка скролла
      hashSettings: {
        location: true,
        // Хеш в адресной строке
        goHash: true
        // Переход при наличии в адресной строке
      },
      on: {
        // События
        beforeOpen: function() {
        },
        afterOpen: function() {
        },
        beforeClose: function() {
        },
        afterClose: function() {
        }
      }
    };
    this.youTubeCode;
    this.isOpen = false;
    this.targetOpen = {
      selector: false,
      element: false
    };
    this.previousOpen = {
      selector: false,
      element: false
    };
    this.lastClosed = {
      selector: false,
      element: false
    };
    this._dataValue = false;
    this.hash = false;
    this._reopen = false;
    this._selectorOpen = false;
    this.lastFocusEl = false;
    this._focusEl = [
      "a[href]",
      'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
      "button:not([disabled]):not([aria-hidden])",
      "select:not([disabled]):not([aria-hidden])",
      "textarea:not([disabled]):not([aria-hidden])",
      "area[href]",
      "iframe",
      "object",
      "embed",
      "[contenteditable]",
      '[tabindex]:not([tabindex^="-"])'
    ];
    this.options = {
      ...config,
      ...options,
      classes: {
        ...config.classes,
        ...options?.classes
      },
      hashSettings: {
        ...config.hashSettings,
        ...options?.hashSettings
      },
      on: {
        ...config.on,
        ...options?.on
      }
    };
    this.bodyLock = false;
    this.options.init ? this.initPopups() : null;
  }
  initPopups() {
    this.buildPopup();
    this.eventsPopup();
  }
  buildPopup() {
  }
  eventsPopup() {
    document.addEventListener("click", (function(e) {
      const buttonOpen = e.target.closest(`[${this.options.attributeOpenButton}]`);
      if (buttonOpen) {
        e.preventDefault();
        this._dataValue = buttonOpen.getAttribute(this.options.attributeOpenButton) ? buttonOpen.getAttribute(this.options.attributeOpenButton) : "error";
        this.youTubeCode = buttonOpen.getAttribute(this.options.youtubeAttribute) ? buttonOpen.getAttribute(this.options.youtubeAttribute) : null;
        if (this._dataValue !== "error") {
          if (!this.isOpen) this.lastFocusEl = buttonOpen;
          this.targetOpen.selector = `${this._dataValue}`;
          this._selectorOpen = true;
          this.open();
          return;
        }
        return;
      }
      const buttonClose = e.target.closest(`[${this.options.attributeCloseButton}]`);
      if (buttonClose || !e.target.closest(`[${this.options.classes.popupContent}]`) && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }
    }).bind(this));
    document.addEventListener("keydown", (function(e) {
      if (this.options.closeEsc && e.which == 27 && e.code === "Escape" && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }
      if (this.options.focusCatch && e.which == 9 && this.isOpen) {
        this._focusCatch(e);
        return;
      }
    }).bind(this));
    if (this.options.hashSettings.goHash) {
      window.addEventListener("hashchange", (function() {
        if (window.location.hash) {
          this._openToHash();
        } else {
          this.close(this.targetOpen.selector);
        }
      }).bind(this));
      if (window.location.hash) {
        this._openToHash();
      }
    }
  }
  open(selectorValue) {
    if (bodyLockStatus) {
      this.bodyLock = document.documentElement.hasAttribute("data-fls-scrolllock") && !this.isOpen ? true : false;
      if (selectorValue && typeof selectorValue === "string" && selectorValue.trim() !== "") {
        this.targetOpen.selector = selectorValue;
        this._selectorOpen = true;
      }
      if (this.isOpen) {
        this._reopen = true;
        this.close();
      }
      if (!this._selectorOpen) this.targetOpen.selector = this.lastClosed.selector;
      if (!this._reopen) this.previousActiveElement = document.activeElement;
      this.targetOpen.element = document.querySelector(`[${this.options.attributeMain}=${this.targetOpen.selector}]`);
      if (this.targetOpen.element) {
        const codeVideo = this.youTubeCode || this.targetOpen.element.getAttribute(`${this.options.youtubeAttribute}`);
        if (codeVideo) {
          const urlVideo = `https://www.youtube.com/embed/${codeVideo}?rel=0&showinfo=0&autoplay=1`;
          const iframe = document.createElement("iframe");
          const autoplay = this.options.setAutoplayYoutube ? "autoplay;" : "";
          iframe.setAttribute("allowfullscreen", "");
          iframe.setAttribute("allow", `${autoplay}; encrypted-media`);
          iframe.setAttribute("src", urlVideo);
          if (!this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`)) {
            this.targetOpen.element.querySelector("[data-fls-popup-content]").setAttribute(`${this.options.youtubePlaceAttribute}`, "");
          }
          this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`).appendChild(iframe);
        }
        if (this.options.hashSettings.location) {
          this._getHash();
          this._setHash();
        }
        this.options.on.beforeOpen(this);
        document.dispatchEvent(new CustomEvent("beforePopupOpen", {
          detail: {
            popup: this
          }
        }));
        this.targetOpen.element.setAttribute(this.options.classes.popupActive, "");
        document.documentElement.setAttribute(this.options.classes.bodyActive, "");
        if (!this._reopen) {
          !this.bodyLock ? bodyLock() : null;
        } else this._reopen = false;
        this.targetOpen.element.setAttribute("aria-hidden", "false");
        this.previousOpen.selector = this.targetOpen.selector;
        this.previousOpen.element = this.targetOpen.element;
        this._selectorOpen = false;
        this.isOpen = true;
        setTimeout(() => {
          this._focusTrap();
        }, 50);
        this.options.on.afterOpen(this);
        document.dispatchEvent(new CustomEvent("afterPopupOpen", {
          detail: {
            popup: this
          }
        }));
      }
    }
  }
  close(selectorValue) {
    if (selectorValue && typeof selectorValue === "string" && selectorValue.trim() !== "") {
      this.previousOpen.selector = selectorValue;
    }
    if (!this.isOpen || !bodyLockStatus) {
      return;
    }
    this.options.on.beforeClose(this);
    document.dispatchEvent(new CustomEvent("beforePopupClose", {
      detail: {
        popup: this
      }
    }));
    if (this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`)) {
      setTimeout(() => {
        this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`).innerHTML = "";
      }, 500);
    }
    this.previousOpen.element.removeAttribute(this.options.classes.popupActive);
    this.previousOpen.element.setAttribute("aria-hidden", "true");
    if (!this._reopen) {
      document.documentElement.removeAttribute(this.options.classes.bodyActive);
      !this.bodyLock ? bodyUnlock() : null;
      this.isOpen = false;
    }
    this._removeHash();
    if (this._selectorOpen) {
      this.lastClosed.selector = this.previousOpen.selector;
      this.lastClosed.element = this.previousOpen.element;
    }
    this.options.on.afterClose(this);
    document.dispatchEvent(new CustomEvent("afterPopupClose", {
      detail: {
        popup: this
      }
    }));
    setTimeout(() => {
      this._focusTrap();
    }, 50);
  }
  // Получение хеша 
  _getHash() {
    if (this.options.hashSettings.location) {
      this.hash = `#${this.targetOpen.selector}`;
    }
  }
  _openToHash() {
    let classInHash = window.location.hash.replace("#", "");
    const openButton = document.querySelector(`[${this.options.attributeOpenButton}="${classInHash}"]`);
    if (openButton) {
      this.youTubeCode = openButton.getAttribute(this.options.youtubeAttribute) ? openButton.getAttribute(this.options.youtubeAttribute) : null;
    }
    if (classInHash) this.open(classInHash);
  }
  // Установка хеша
  _setHash() {
    history.pushState("", "", this.hash);
  }
  _removeHash() {
    history.pushState("", "", window.location.href.split("#")[0]);
  }
  _focusCatch(e) {
    const focusable = this.targetOpen.element.querySelectorAll(this._focusEl);
    const focusArray = Array.prototype.slice.call(focusable);
    const focusedIndex = focusArray.indexOf(document.activeElement);
    if (e.shiftKey && focusedIndex === 0) {
      focusArray[focusArray.length - 1].focus();
      e.preventDefault();
    }
    if (!e.shiftKey && focusedIndex === focusArray.length - 1) {
      focusArray[0].focus();
      e.preventDefault();
    }
  }
  _focusTrap() {
    const focusable = this.previousOpen.element.querySelectorAll(this._focusEl);
    if (!this.isOpen && this.lastFocusEl) {
      this.lastFocusEl.focus();
    } else {
      focusable[0].focus();
    }
  }
}
document.querySelector("[data-fls-popup]") ? window.addEventListener("load", () => window.flsPopup = new Popup({})) : null;
class FullPage {
  constructor(element, options) {
    const config = {
      noEventSelector: "[data-fls-fullpage-noevent]",
      classInit: "--fullpage-init",
      wrapperAnimatedClass: "--fullpage-switching",
      selectorSection: "[data-fls-fullpage-section]",
      activeClass: "--fullpage-active-section",
      previousClass: "--fullpage-previous-section",
      nextClass: "--fullpage-next-section",
      idActiveSection: 0,
      // Эффекты: fade, cards, slider
      mode: element.dataset.flsFullpageEffect ? element.dataset.flsFullpageEffect : "slider",
      bullets: element.hasAttribute("data-fls-fullpage-bullets"),
      bulletsClass: "--fullpage-bullets",
      bulletClass: "--fullpage-bullet",
      bulletActiveClass: "--fullpage-bullet-active",
      onInit() {
      },
      onSwitching() {
      },
      onDestroy() {
      }
    };
    this.options = Object.assign(config, options);
    this.wrapper = element;
    this.sections = this.wrapper.querySelectorAll(this.options.selectorSection);
    this.activeSection = false;
    this.activeSectionId = false;
    this.previousSection = false;
    this.previousSectionId = false;
    this.nextSection = false;
    this.nextSectionId = false;
    this.bulletsWrapper = false;
    this.stopEvent = false;
    this.clickOrTouch = false;
    this._iOSPreventTouchMove = null;
    this._resizeRaf = 0;
    if (this.sections.length) this.init();
  }
  // ===============================
  init() {
    if (this.options.idActiveSection > this.sections.length - 1) return;
    this.setId();
    this.activeSectionId = this.options.idActiveSection;
    this.setEffectsClasses();
    this.setClasses();
    this.setStyle();
    if (this.options.bullets) {
      this.setBullets();
      this.setActiveBullet(this.activeSectionId);
    }
    this.bindEvents();
    this.setEvents();
    setTimeout(() => {
      document.documentElement.classList.add(this.options.classInit);
      this.options.onInit(this);
      document.dispatchEvent(new CustomEvent("fpinit", { detail: { fp: this } }));
    }, 0);
  }
  // ===============================
  destroy() {
    this.removeEvents();
    this.removeClasses();
    document.documentElement.classList.remove(this.options.classInit);
    document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
    this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
    this.removeEffectsClasses();
    this.removeZIndex();
    this.removeStyle();
    this.removeId();
    this.removeBullets();
    if (this._resizeRaf) {
      cancelAnimationFrame(this._resizeRaf);
      this._resizeRaf = 0;
    }
    this.options.onDestroy(this);
    document.dispatchEvent(new CustomEvent("fpdestroy", { detail: { fp: this } }));
  }
  // ===============================
  setId() {
    for (let i = 0; i < this.sections.length; i++) {
      this.sections[i].setAttribute("data-fls-fullpage-id", i);
    }
  }
  removeId() {
    for (let i = 0; i < this.sections.length; i++) {
      this.sections[i].removeAttribute("data-fls-fullpage-id");
    }
  }
  // ===============================
  setClasses() {
    this.previousSectionId = this.activeSectionId - 1 >= 0 ? this.activeSectionId - 1 : false;
    this.nextSectionId = this.activeSectionId + 1 < this.sections.length ? this.activeSectionId + 1 : false;
    this.activeSection = this.sections[this.activeSectionId];
    this.activeSection.classList.add(this.options.activeClass);
    for (let i = 0; i < this.sections.length; i++) {
      document.documentElement.classList.remove(`--fullpage-section-${i}`);
    }
    document.documentElement.classList.add(`--fullpage-section-${this.activeSectionId}`);
    if (this.previousSectionId !== false) {
      this.previousSection = this.sections[this.previousSectionId];
      this.previousSection.classList.add(this.options.previousClass);
    } else {
      this.previousSection = false;
    }
    if (this.nextSectionId !== false) {
      this.nextSection = this.sections[this.nextSectionId];
      this.nextSection.classList.add(this.options.nextClass);
    } else {
      this.nextSection = false;
    }
  }
  removeClasses() {
    for (let i = 0; i < this.sections.length; i++) {
      const s = this.sections[i];
      s.classList.remove(this.options.activeClass, this.options.previousClass, this.options.nextClass);
      document.documentElement.classList.remove(`--fullpage-section-${i}`);
    }
    document.documentElement.classList.remove("--fullpage-up", "--fullpage-down");
  }
  // ===============================
  setEffectsClasses() {
    switch (this.options.mode) {
      case "slider":
        this.wrapper.classList.add("slider-mode");
        break;
      case "cards":
        this.wrapper.classList.add("cards-mode");
        this.setZIndex();
        break;
      case "fade":
        this.wrapper.classList.add("fade-mode");
        this.setZIndex();
        break;
    }
  }
  // ✅ BUGFIX: убираем z-index, а не ставим
  removeEffectsClasses() {
    switch (this.options.mode) {
      case "slider":
        this.wrapper.classList.remove("slider-mode");
        break;
      case "cards":
        this.wrapper.classList.remove("cards-mode");
        this.removeZIndex();
        break;
      case "fade":
        this.wrapper.classList.remove("fade-mode");
        this.removeZIndex();
        break;
    }
  }
  // ===============================
  setStyle() {
    switch (this.options.mode) {
      case "slider":
        this.styleSlider();
        break;
      case "cards":
        this.styleCards();
        break;
      case "fade":
        this.styleFade();
        break;
    }
  }
  styleSlider() {
    for (let i = 0; i < this.sections.length; i++) {
      const s = this.sections[i];
      if (i === this.activeSectionId) s.style.transform = "translate3D(0,0,0)";
      else if (i < this.activeSectionId) s.style.transform = "translate3D(0,-100%,0)";
      else s.style.transform = "translate3D(0,100%,0)";
    }
  }
  styleCards() {
    for (let i = 0; i < this.sections.length; i++) {
      const s = this.sections[i];
      if (i >= this.activeSectionId) s.style.transform = "translate3D(0,0,0)";
      else s.style.transform = "translate3D(0,-100%,0)";
    }
  }
  styleFade() {
    for (let i = 0; i < this.sections.length; i++) {
      const s = this.sections[i];
      if (i === this.activeSectionId) {
        s.style.opacity = "1";
        s.style.pointerEvents = "all";
      } else {
        s.style.opacity = "0";
        s.style.pointerEvents = "none";
      }
    }
  }
  removeStyle() {
    for (let i = 0; i < this.sections.length; i++) {
      const s = this.sections[i];
      s.style.opacity = "";
      s.style.visibility = "";
      s.style.transform = "";
      s.style.pointerEvents = "";
    }
  }
  // ===============================
  haveScroll(element) {
    return element.scrollHeight !== window.innerHeight;
  }
  checkScroll(yCoord, element) {
    this.goScroll = false;
    if (!this.stopEvent && element) {
      this.goScroll = true;
      if (this.haveScroll(element)) {
        this.goScroll = false;
        const position = Math.round(element.scrollHeight - element.scrollTop);
        if (Math.abs(position - element.scrollHeight) < 2 && yCoord <= 0 || Math.abs(position - element.clientHeight) < 2 && yCoord >= 0) {
          this.goScroll = true;
        }
      }
    }
  }
  // ===============================
  bindEvents() {
    this.events = {
      wheel: this.wheel.bind(this),
      touchdown: this.touchDown.bind(this),
      touchup: this.touchUp.bind(this),
      touchmove: this.touchMove.bind(this),
      touchcancel: this.touchUp.bind(this),
      transitionEnd: this.transitionend.bind(this),
      click: this.clickBullets.bind(this),
      // ✅ NEW: resize reflow
      resize: this.resize.bind(this)
    };
    if (isMobile.iOS()) {
      this._iOSPreventTouchMove = (e) => {
        if (e.cancelable) e.preventDefault();
      };
      document.addEventListener("touchmove", this._iOSPreventTouchMove, { passive: false });
    }
  }
  setEvents() {
    this.wrapper.addEventListener("wheel", this.events.wheel);
    this.wrapper.addEventListener("touchstart", this.events.touchdown, { passive: true });
    window.addEventListener("resize", this.events.resize);
    if (this.options.bullets && this.bulletsWrapper) {
      this.bulletsWrapper.addEventListener("click", this.events.click);
    }
  }
  // ✅ BUGFIX: снимали не то событие (touchdown вместо touchstart)
  removeEvents() {
    this.wrapper.removeEventListener("wheel", this.events.wheel);
    this.wrapper.removeEventListener("touchstart", this.events.touchdown);
    this.wrapper.removeEventListener("touchend", this.events.touchup);
    this.wrapper.removeEventListener("touchcancel", this.events.touchup);
    this.wrapper.removeEventListener("touchmove", this.events.touchmove);
    window.removeEventListener("resize", this.events.resize);
    if (this.bulletsWrapper) {
      this.bulletsWrapper.removeEventListener("click", this.events.click);
    }
    if (this._iOSPreventTouchMove) {
      document.removeEventListener("touchmove", this._iOSPreventTouchMove);
      this._iOSPreventTouchMove = null;
    }
  }
  // ✅ NEW: resize handler (throttle via rAF)
  resize() {
    if (this.stopEvent) return;
    if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
    this._resizeRaf = requestAnimationFrame(() => {
      this._resizeRaf = 0;
      this.setStyle();
      document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
      this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
    });
  }
  // ===============================
  clickBullets(e) {
    const bullet = e.target.closest(`.${this.options.bulletClass}`);
    if (!bullet) return;
    const arr = Array.from(this.bulletsWrapper.children);
    const id = arr.indexOf(bullet);
    this.switchingSection(id);
  }
  setActiveBullet(idButton) {
    if (!this.bulletsWrapper) return;
    const bullets = this.bulletsWrapper.children;
    for (let i = 0; i < bullets.length; i++) {
      if (idButton === i) bullets[i].classList.add(this.options.bulletActiveClass);
      else bullets[i].classList.remove(this.options.bulletActiveClass);
    }
  }
  // ===============================
  touchDown(e) {
    this._yP = e.changedTouches[0].pageY;
    this._eventElement = e.target.closest(`.${this.options.activeClass}`);
    if (!this._eventElement) return;
    this._eventElement.addEventListener("touchend", this.events.touchup, { passive: true });
    this._eventElement.addEventListener("touchcancel", this.events.touchup, { passive: true });
    this._eventElement.addEventListener("touchmove", this.events.touchmove, { passive: false });
    this.clickOrTouch = true;
    if (isMobile.iOS()) {
      if (this._eventElement.scrollHeight !== this._eventElement.clientHeight) {
        if (this._eventElement.scrollTop === 0) this._eventElement.scrollTop = 1;
        if (this._eventElement.scrollTop === this._eventElement.scrollHeight - this._eventElement.clientHeight) {
          this._eventElement.scrollTop = this._eventElement.scrollHeight - this._eventElement.clientHeight - 1;
        }
      }
      this.allowUp = this._eventElement.scrollTop > 0;
      this.allowDown = this._eventElement.scrollTop < this._eventElement.scrollHeight - this._eventElement.clientHeight;
      this.lastY = e.changedTouches[0].pageY;
    }
  }
  touchMove(e) {
    const targetElement = e.target.closest(`.${this.options.activeClass}`);
    if (isMobile.iOS()) {
      const up = e.changedTouches[0].pageY > this.lastY;
      const down = !up;
      this.lastY = e.changedTouches[0].pageY;
      if (targetElement) {
        if (up && this.allowUp || down && this.allowDown) e.stopPropagation();
        else if (e.cancelable) e.preventDefault();
      }
    }
    if (!this.clickOrTouch || e.target.closest(this.options.noEventSelector)) return;
    const yCoord = this._yP - e.changedTouches[0].pageY;
    this.checkScroll(yCoord, targetElement);
    if (this.goScroll && Math.abs(yCoord) > 20) this.choiceOfDirection(yCoord);
  }
  touchUp() {
    if (!this._eventElement) return this.clickOrTouch = false;
    this._eventElement.removeEventListener("touchend", this.events.touchup);
    this._eventElement.removeEventListener("touchcancel", this.events.touchup);
    this._eventElement.removeEventListener("touchmove", this.events.touchmove);
    this.clickOrTouch = false;
  }
  transitionend() {
    this.stopEvent = false;
    document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
    this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
  }
  wheel(e) {
    if (e.target.closest(this.options.noEventSelector)) return;
    const yCoord = e.deltaY;
    const targetElement = e.target.closest(`.${this.options.activeClass}`);
    this.checkScroll(yCoord, targetElement);
    if (this.goScroll) this.choiceOfDirection(yCoord);
  }
  choiceOfDirection(direction) {
    if (direction > 0 && this.nextSection !== false) {
      this.activeSectionId = this.activeSectionId + 1 < this.sections.length ? ++this.activeSectionId : this.activeSectionId;
    } else if (direction < 0 && this.previousSection !== false) {
      this.activeSectionId = this.activeSectionId - 1 >= 0 ? --this.activeSectionId : this.activeSectionId;
    }
    this.switchingSection(this.activeSectionId, direction);
  }
  switchingSection(idSection = this.activeSectionId, direction) {
    if (!direction) {
      if (idSection < this.activeSectionId) direction = -100;
      else if (idSection > this.activeSectionId) direction = 100;
    }
    this.activeSectionId = idSection;
    this.stopEvent = true;
    if (this.previousSectionId === false && direction < 0 || this.nextSectionId === false && direction > 0) {
      this.stopEvent = false;
    }
    if (!this.stopEvent) return;
    document.documentElement.classList.add(this.options.wrapperAnimatedClass);
    this.wrapper.classList.add(this.options.wrapperAnimatedClass);
    this.removeClasses();
    this.setClasses();
    this.setStyle();
    if (this.options.bullets) this.setActiveBullet(this.activeSectionId);
    let delaySection;
    if (direction < 0) {
      delaySection = this.activeSection.dataset.flsFullpageDirectionUp ? parseInt(this.activeSection.dataset.flsFullpageDirectionUp) : 500;
      document.documentElement.classList.add("--fullpage-up");
      document.documentElement.classList.remove("--fullpage-down");
    } else {
      delaySection = this.activeSection.dataset.flsFullpageDirectionDown ? parseInt(this.activeSection.dataset.flsFullpageDirectionDown) : 500;
      document.documentElement.classList.remove("--fullpage-up");
      document.documentElement.classList.add("--fullpage-down");
    }
    setTimeout(() => {
      this.events.transitionEnd();
    }, delaySection);
    this.options.onSwitching(this);
    document.dispatchEvent(new CustomEvent("fpswitching", { detail: { fp: this } }));
  }
  // ===============================
  setBullets() {
    this.bulletsWrapper = document.querySelector(`.${this.options.bulletsClass}`);
    if (!this.bulletsWrapper) {
      const bullets = document.createElement("div");
      bullets.classList.add(this.options.bulletsClass);
      this.wrapper.append(bullets);
      this.bulletsWrapper = bullets;
    }
    this.bulletsWrapper.innerHTML = "";
    for (let i = 0; i < this.sections.length; i++) {
      const span = document.createElement("span");
      span.classList.add(this.options.bulletClass);
      this.bulletsWrapper.append(span);
    }
  }
  removeBullets() {
    if (!this.bulletsWrapper) return;
    const inside = this.wrapper.contains(this.bulletsWrapper);
    if (inside) this.bulletsWrapper.remove();
    else this.bulletsWrapper.innerHTML = "";
    this.bulletsWrapper = false;
  }
  // ===============================
  setZIndex() {
    let z = this.sections.length;
    for (let i = 0; i < this.sections.length; i++) {
      this.sections[i].style.zIndex = z;
      z--;
    }
  }
  removeZIndex() {
    for (let i = 0; i < this.sections.length; i++) {
      this.sections[i].style.zIndex = "";
    }
  }
  // =====================================================
  // ✅ FIX SCROLLTO IN FULLPAGE:
  // Перехватываем клики по [data-fls-scrollto] в CAPTURE,
  // жестко глушим scroll/to и переводим в switchingSection.
  // =====================================================
  static bindScrollToBridge() {
    if (FullPage._scrollBridgeBound) return;
    FullPage._scrollBridgeBound = true;
    document.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest("[data-fls-scrollto]");
        if (!link) return;
        if (!window.flsFullpage) return;
        const selector = link.dataset.flsScrollto;
        if (!selector) return;
        const target = document.querySelector(selector);
        if (!target) return;
        const section = target.closest("[data-fls-fullpage-section]");
        if (!section) return;
        const id = Number(section.getAttribute("data-fls-fullpage-id"));
        if (Number.isNaN(id)) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        if (location.hash) {
          history.replaceState(null, "", location.pathname + location.search);
        }
        window.flsFullpage.switchingSection(id);
      },
      true
      // ✅ capture
    );
  }
}
FullPage.bindScrollToBridge();
const fpRoot = document.querySelector("[data-fls-fullpage]");
if (fpRoot) {
  const mq = window.matchMedia("(min-width: 992px)");
  let lastSectionId = 0;
  const getSectionById = (id) => fpRoot.querySelector(`[data-fls-fullpage-id="${id}"]`) || fpRoot.querySelector("[data-fls-fullpage-section]");
  const enableFP = () => {
    if (window.flsFullpage) return;
    window.scrollTo(0, 0);
    window.flsFullpage = new FullPage(fpRoot, {
      idActiveSection: lastSectionId
    });
    setTimeout(() => {
      if (window.flsFullpage) window.flsFullpage.setStyle();
    }, 0);
  };
  const disableFP = () => {
    if (!window.flsFullpage) return;
    lastSectionId = window.flsFullpage.activeSectionId || 0;
    window.flsFullpage.destroy();
    window.flsFullpage = null;
    const section = getSectionById(lastSectionId);
    if (section) section.scrollIntoView({ block: "start" });
  };
  const syncFP = () => {
    if (mq.matches) enableFP();
    else disableFP();
  };
  window.addEventListener("load", syncFP);
  if (mq.addEventListener) mq.addEventListener("change", syncFP);
  else mq.addListener(syncFP);
}
class DynamicAdapt {
  constructor() {
    this.type = "max";
    this.init();
  }
  init() {
    this.objects = [];
    this.daClassname = "--dynamic";
    this.nodes = [...document.querySelectorAll("[data-fls-dynamic]")];
    this.nodes.forEach((node) => {
      const data = node.dataset.flsDynamic.trim();
      const dataArray = data.split(`,`);
      const object = {};
      object.element = node;
      object.parent = node.parentNode;
      object.destinationParent = dataArray[3] ? node.closest(dataArray[3].trim()) || document : document;
      dataArray[3] ? dataArray[3].trim() : null;
      const objectSelector = dataArray[0] ? dataArray[0].trim() : null;
      if (objectSelector) {
        const foundDestination = object.destinationParent.querySelector(objectSelector);
        if (foundDestination) {
          object.destination = foundDestination;
        }
      }
      object.breakpoint = dataArray[1] ? dataArray[1].trim() : `767.98`;
      object.place = dataArray[2] ? dataArray[2].trim() : `last`;
      object.index = this.indexInParent(object.parent, object.element);
      this.objects.push(object);
    });
    this.arraySort(this.objects);
    this.mediaQueries = this.objects.map(({ breakpoint }) => `(${this.type}-width: ${breakpoint / 16}em),${breakpoint}`).filter((item, index, self) => self.indexOf(item) === index);
    this.mediaQueries.forEach((media) => {
      const mediaSplit = media.split(",");
      const matchMedia = window.matchMedia(mediaSplit[0]);
      const mediaBreakpoint = mediaSplit[1];
      const objectsFilter = this.objects.filter(({ breakpoint }) => breakpoint === mediaBreakpoint);
      matchMedia.addEventListener("change", () => {
        this.mediaHandler(matchMedia, objectsFilter);
      });
      this.mediaHandler(matchMedia, objectsFilter);
    });
  }
  mediaHandler(matchMedia, objects) {
    if (matchMedia.matches) {
      objects.forEach((object) => {
        if (object.destination) {
          this.moveTo(object.place, object.element, object.destination);
        }
      });
    } else {
      objects.forEach(({ parent, element, index }) => {
        if (element.classList.contains(this.daClassname)) {
          this.moveBack(parent, element, index);
        }
      });
    }
  }
  moveTo(place, element, destination) {
    element.classList.add(this.daClassname);
    const index = place === "last" || place === "first" ? place : parseInt(place, 10);
    if (index === "last" || index >= destination.children.length) {
      destination.append(element);
    } else if (index === "first") {
      destination.prepend(element);
    } else {
      destination.children[index].before(element);
    }
  }
  moveBack(parent, element, index) {
    element.classList.remove(this.daClassname);
    if (parent.children[index] !== void 0) {
      parent.children[index].before(element);
    } else {
      parent.append(element);
    }
  }
  indexInParent(parent, element) {
    return [...parent.children].indexOf(element);
  }
  arraySort(arr) {
    if (this.type === "min") {
      arr.sort((a, b) => {
        if (a.breakpoint === b.breakpoint) {
          if (a.place === b.place) {
            return 0;
          }
          if (a.place === "first" || b.place === "last") {
            return -1;
          }
          if (a.place === "last" || b.place === "first") {
            return 1;
          }
          return 0;
        }
        return a.breakpoint - b.breakpoint;
      });
    } else {
      arr.sort((a, b) => {
        if (a.breakpoint === b.breakpoint) {
          if (a.place === b.place) {
            return 0;
          }
          if (a.place === "first" || b.place === "last") {
            return 1;
          }
          if (a.place === "last" || b.place === "first") {
            return -1;
          }
          return 0;
        }
        return b.breakpoint - a.breakpoint;
      });
      return;
    }
  }
}
if (document.querySelector("[data-fls-dynamic]")) {
  window.addEventListener("load", () => window.flsDynamic = new DynamicAdapt());
}
function pageNavigation() {
  document.addEventListener("click", pageNavigationAction);
  document.addEventListener("watcherCallback", pageNavigationAction);
  function pageNavigationAction(e) {
    if (e.type === "click") {
      const targetElement = e.target;
      if (targetElement.closest("[data-fls-scrollto]")) {
        const gotoLink = targetElement.closest("[data-fls-scrollto]");
        const gotoLinkSelector = gotoLink.dataset.flsScrollto ? gotoLink.dataset.flsScrollto : "";
        const noHeader = gotoLink.hasAttribute("data-fls-scrollto-header") ? true : false;
        const gotoSpeed = gotoLink.dataset.flsScrolltoSpeed ? gotoLink.dataset.flsScrolltoSpeed : 500;
        const offsetTop = gotoLink.dataset.flsScrolltoTop ? parseInt(gotoLink.dataset.flsScrolltoTop) : 0;
        if (window.fullpage) {
          const fullpageSection = document.querySelector(`${gotoLinkSelector}`).closest("[data-fls-fullpage-section]");
          const fullpageSectionId = fullpageSection ? +fullpageSection.dataset.flsFullpageId : null;
          if (fullpageSectionId !== null) {
            window.fullpage.switchingSection(fullpageSectionId);
            if (document.documentElement.hasAttribute("data-fls-menu-open")) {
              bodyUnlock();
              document.documentElement.removeAttribute("data-fls-menu-open");
            }
          }
        } else {
          gotoBlock(gotoLinkSelector, noHeader, gotoSpeed, offsetTop);
        }
        e.preventDefault();
      }
    } else if (e.type === "watcherCallback" && e.detail) {
      const entry = e.detail.entry;
      const targetElement = entry.target;
      if (targetElement.dataset.flsWatcher === "navigator") {
        document.querySelector(`[data-fls-scrollto].--navigator-active`);
        let navigatorCurrentItem;
        if (targetElement.id && document.querySelector(`[data-fls-scrollto="#${targetElement.id}"]`)) {
          navigatorCurrentItem = document.querySelector(`[data-fls-scrollto="#${targetElement.id}"]`);
        } else if (targetElement.classList.length) {
          for (let index = 0; index < targetElement.classList.length; index++) {
            const element = targetElement.classList[index];
            if (document.querySelector(`[data-fls-scrollto=".${element}"]`)) {
              navigatorCurrentItem = document.querySelector(`[data-fls-scrollto=".${element}"]`);
              break;
            }
          }
        }
        if (entry.isIntersecting) {
          navigatorCurrentItem ? navigatorCurrentItem.classList.add("--navigator-active") : null;
        } else {
          navigatorCurrentItem ? navigatorCurrentItem.classList.remove("--navigator-active") : null;
        }
      }
    }
  }
  if (getHash()) {
    let goToHash;
    if (document.querySelector(`#${getHash()}`)) {
      goToHash = `#${getHash()}`;
    } else if (document.querySelector(`.${getHash()}`)) {
      goToHash = `.${getHash()}`;
    }
    goToHash ? gotoBlock(goToHash) : null;
  }
}
document.querySelector("[data-fls-scrollto]") ? window.addEventListener("load", pageNavigation) : null;
