/* Oiowa – interactions et animations */
(function () {
    'use strict';

    var root = document.documentElement;
    var body = document.body;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.classList.add('js');

    /* ---------- En-tête au défilement, barre de progression, bouton haut ---------- */

    var header = document.querySelector('.header');
    var progress = document.querySelector('.progress');
    var topButton = document.querySelector('.top-button');
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;

        if (header) header.classList.toggle('is-scrolled', y > 20);
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
        if (topButton) topButton.classList.toggle('is-visible', y > 600);

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    onScroll();

    if (topButton) {
        topButton.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---------- Menu mobile ---------- */

    var burger = document.querySelector('.burger');

    if (burger) {
        burger.addEventListener('click', function () {
            var open = body.classList.toggle('nav-open');
            burger.setAttribute('aria-expanded', open);
            burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        });

        document.querySelectorAll('.nav a').forEach(function (link) {
            link.addEventListener('click', function () {
                body.classList.remove('nav-open');
                burger.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && body.classList.contains('nav-open')) {
                body.classList.remove('nav-open');
                burger.setAttribute('aria-expanded', 'false');
                burger.focus();
            }
        });
    }

    /* ---------- Titre découpé en mots animés ---------- */

    document.querySelectorAll('[data-split]').forEach(function (el) {
        var index = 0;

        function wrap(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(part));
                            return;
                        }
                        var outer = document.createElement('span');
                        var inner = document.createElement('span');
                        outer.className = 'w';
                        inner.textContent = part;
                        inner.style.setProperty('--i', index++);
                        outer.appendChild(inner);
                        frag.appendChild(outer);
                    });
                    node.replaceChild(frag, child);
                } else if (child.nodeType === 1 && !child.classList.contains('rotator') && !child.classList.contains('gradient-text')) {
                    wrap(child);
                } else if (child.nodeType === 1) {
                    // mot qui tourne ou texte en dégradé : animé comme un seul bloc
                    var outer = document.createElement('span');
                    var inner = document.createElement('span');
                    outer.className = 'w';
                    inner.style.setProperty('--i', index++);
                    node.replaceChild(outer, child);
                    inner.appendChild(child);
                    outer.appendChild(inner);
                }
            });
        }

        wrap(el);
        el.classList.add('split-words');
    });

    /* ---------- Mots qui défilent dans le titre ---------- */

    document.querySelectorAll('.rotator').forEach(function (rotator) {
        var words = rotator.querySelectorAll('span');
        if (words.length < 2 || reduceMotion) return;

        var current = 0;
        setInterval(function () {
            var prev = words[current];
            current = (current + 1) % words.length;
            prev.classList.remove('is-active');
            prev.classList.add('is-leaving');
            words[current].classList.remove('is-leaving');
            words[current].classList.add('is-active');
            setTimeout(function () { prev.classList.remove('is-leaving'); }, 700);
        }, 2600);
    });

    /* ---------- Apparition au défilement ---------- */

    var revealTargets = document.querySelectorAll('.reveal, .steps, .mark');

    if ('IntersectionObserver' in window && !reduceMotion) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        revealTargets.forEach(function (el) { observer.observe(el); });
    } else {
        revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
    }

    // décalage automatique des éléments d'une même grille
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (child, i) {
            child.style.setProperty('--delay', (i * 0.12) + 's');
        });
    });

    /* ---------- Halo des cartes qui suit la souris ---------- */

    document.querySelectorAll('.card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
            var rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        });
    });

    /* ---------- Lueur qui suit le curseur (ordinateur uniquement) ---------- */

    var glow = document.querySelector('.cursor-glow');

    if (glow && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var gx = 0, gy = 0, tx = 0, ty = 0, running = false;

        function animateGlow() {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
            if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) {
                window.requestAnimationFrame(animateGlow);
            } else {
                running = false;
            }
        }

        window.addEventListener('pointermove', function (e) {
            tx = e.clientX;
            ty = e.clientY;
            body.classList.add('has-cursor');
            if (!running) {
                running = true;
                window.requestAnimationFrame(animateGlow);
            }
        }, { passive: true });

        document.addEventListener('pointerleave', function () {
            body.classList.remove('has-cursor');
        });
    }

    /* ---------- Effet magnétique sur les boutons principaux ---------- */

    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
            btn.addEventListener('pointermove', function (e) {
                var rect = btn.getBoundingClientRect();
                var x = (e.clientX - rect.left - rect.width / 2) * 0.25;
                var y = (e.clientY - rect.top - rect.height / 2) * 0.35;
                btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            });
            btn.addEventListener('pointerleave', function () {
                btn.style.transform = '';
            });
        });
    }

    /* ---------- FAQ : une seule question ouverte à la fois ---------- */

    document.querySelectorAll('.faq').forEach(function (faq) {
        var items = faq.querySelectorAll('details');
        items.forEach(function (item) {
            item.addEventListener('toggle', function () {
                if (!item.open) return;
                items.forEach(function (other) {
                    if (other !== item) other.open = false;
                });
            });
        });
    });

    /* ---------- Année du pied de page ---------- */

    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
