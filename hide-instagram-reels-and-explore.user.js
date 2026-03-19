// ==UserScript==
// @name         Hide Instagram Reels and Explore Button
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Hide Instagram reels, the explore button, and the open-in-app banner from the webpage
// @author       AKM777
// @match        https://www.instagram.com/*
// @grant        none
// ==/UserScript==
// @license MIT
(function () {
    'use strict';

    const APP_BANNER_TEXT_PATTERNS = [
        /open in the instagram app/i,
        /^open app$/i,
        /^use app$/i
    ];
    const APP_BANNER_ACTION_PATTERNS = [
        /^open$/i,
        /^use app$/i
    ];

    function normalizeText(value) {
        return (value || '').replace(/\s+/g, ' ').trim();
    }

    function matchesAppBannerText(value) {
        const text = normalizeText(value);
        return text && APP_BANNER_TEXT_PATTERNS.some(pattern => pattern.test(text));
    }

    function matchesAppBannerAction(value) {
        const text = normalizeText(value);
        return text && APP_BANNER_ACTION_PATTERNS.some(pattern => pattern.test(text));
    }

    function getElementText(el) {
        return normalizeText([
            el.textContent,
            el.getAttribute('aria-label'),
            el.getAttribute('title')
        ].filter(Boolean).join(' '));
    }

    function hideElement(el) {
        el.style.display = 'none';
    }

    function isTopBannerFrame(el) {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 &&
            rect.height <= 180 &&
            rect.top <= 220 &&
            rect.bottom > 0 &&
            rect.width >= window.innerWidth * 0.75;
    }

    function isOpenInAppBanner(el) {
        if (!isTopBannerFrame(el)) {
            return false;
        }

        const text = getElementText(el);
        const hasBannerCopy = /open in the instagram app/i.test(text);
        const hasInstagramLabel = /\binstagram\b/i.test(text);
        const hasOpenAction = /\bopen\b/i.test(text) ||
            Array.from(el.querySelectorAll('a, button, div[role="button"]'))
                .some(control => matchesAppBannerAction(getElementText(control)));

        return hasBannerCopy || (hasInstagramLabel && hasOpenAction);
    }

    function hideOpenInAppBanner() {
        const candidates = document.querySelectorAll('header, section, div');

        candidates.forEach(el => {
            if (!isOpenInAppBanner(el)) {
                return;
            }

            hideElement(el);
        });
    }

    // Function to hide reels, navigation items, and top banners
    function hideElements() {
        // Hide reels in feed
        const reelPosts = document.querySelectorAll('article div div div div video'); // Video reels in feed
        reelPosts.forEach(el => {
            const parent = el.closest('article');
            if (parent) hideElement(parent);
        });

        // Hide the "Reels" button
        const reelsButtons = document.querySelectorAll('a[href*="/reels/"], div[role="button"][aria-label*="Reels"]');
        reelsButtons.forEach(el => {
            hideElement(el);
        });

        // Hide the "Explore" button
        const exploreButton = document.querySelector('a[href="/explore/"]'); // Explore button in navigation
        if (exploreButton) {
            hideElement(exploreButton);
        }

        // Hide the mobile "Open in the Instagram app" banner
        hideOpenInAppBanner();
    }

    // Observe the page for dynamic changes
    const observer = new MutationObserver(hideElements);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial execution
    hideElements();
})();
