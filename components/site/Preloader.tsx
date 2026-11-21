/**
 * Preloader (ТЗ §7.5): ≤600 мс, один раз за сессию, не блокирует контент.
 *
 * - инлайн-скрипт до отрисовки помечает повторный визит сессии (skip);
 * - без JS прелоадер исчезает сам по CSS-анимации (≤600 мс);
 * - JS-фолбэк скрывает его через 700 мс, даже если анимация не стартовала;
 * - `pointer-events: none` — не мешает кликам (ТЗ §7.5);
 * - при prefers-reduced-motion и в Static-режиме не показывается.
 */
const SKIP_SCRIPT = `(function(){try{
var h=document.documentElement;
if(sessionStorage.getItem("ds-preloader")){h.classList.add("skip-preloader");}
else{sessionStorage.setItem("ds-preloader","1");
setTimeout(function(){var p=document.getElementById("ds-preloader");if(p){p.style.display="none";}},700);}
}catch(e){}})();`;

export function Preloader() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
      <div className="preloader" id="ds-preloader" aria-hidden="true">
        <span className="preloader-mark">
          DS<i>.</i> DIGITAL
        </span>
      </div>
    </>
  );
}
