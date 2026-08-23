/* global NexT: true */

$(document).ready(function () {

  initPostToc();

  function initPostToc () {
    var tocSelector = '.post-toc';
    var $tocElement = $(tocSelector);
    var activeCurrentSelector = '.active-current';
    var tocItems = collectTocItems();
    var ticking = false;

    if (!tocItems.length) return;

    updateActiveToc();
    bindTocRefresh();
    $(window).on('scroll resize', scheduleUpdateActiveToc);

    function removeCurrentActiveClass () {
      $(tocSelector + ' ' + activeCurrentSelector)
        .removeClass(activeCurrentSelector.substring(1));
    }

    function collectTocItems () {
      return $(tocSelector + ' .nav-link').map(function () {
        var href = this.getAttribute('href');
        var id = href && href.charAt(0) === '#' ? decodeURIComponent(href.substring(1)) : '';
        var target = id && document.getElementById(id);

        return target ? {
          link: this,
          target: target
        } : null;
      }).get();
    }

    function scheduleUpdateActiveToc () {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        updateActiveToc();
      });
    }

    function updateActiveToc () {
      var activeItem = getActiveTocItem();
      if (!activeItem) return;

      var $currentActiveElement = $(activeItem.link).parent();

      $(tocSelector + ' .active').removeClass('active');
      removeCurrentActiveClass();
      $currentActiveElement
        .addClass('active-current')
        .parentsUntil(tocSelector, '.nav-item')
        .addClass('active');

      keepActiveTocVisible($currentActiveElement);
    }

    function getActiveTocItem () {
      var activeItem = tocItems[0];
      var threshold = getScrollSpyOffset();

      tocItems.forEach(function (item) {
        if (item.target.getBoundingClientRect().top <= threshold) {
          activeItem = item;
        }
      });

      return activeItem;
    }

    function keepActiveTocVisible ($currentActiveElement) {
      if (!$currentActiveElement.length || $tocElement[0].scrollHeight <= $tocElement.height()) return;

      var itemTop = $currentActiveElement.position().top;
      var itemBottom = itemTop + $currentActiveElement.outerHeight();
      var visibleTop = 0;
      var visibleBottom = $tocElement.height();

      if (itemTop < visibleTop || itemBottom > visibleBottom) {
        $tocElement.scrollTop(
          itemTop +
          $tocElement.scrollTop() -
          ($tocElement.height() / 2)
        );
      }
    }

    function bindTocRefresh () {
      function refresh () {
        tocItems = collectTocItems();
        scheduleUpdateActiveToc();
      }

      $(window).on('load', refresh);
      $('.post-body img').on('load', refresh);
      $('.post-body video').on('loadedmetadata loadeddata', refresh);

      if (window.MathJax && MathJax.Hub && MathJax.Hub.Queue) {
        MathJax.Hub.Queue(refresh);
      }

      setTimeout(refresh, 300);
      setTimeout(refresh, 1000);
    }

    function getScrollSpyOffset () {
      var sidebarOffset = (CONFIG.sidebar && CONFIG.sidebar.offset) || 0;

      return Math.max(sidebarOffset + 120, 140);
    }
  }

});

$(document).ready(function () {
  var html = $('html');
  var TAB_ANIMATE_DURATION = 200;
  var hasVelocity = $.isFunction(html.velocity);

  $('.sidebar-nav li').on('click', function () {
    var item = $(this);
    var activeTabClassName = 'sidebar-nav-active';
    var activePanelClassName = 'sidebar-panel-active';
    if (item.hasClass(activeTabClassName)) {
      return;
    }

    var currentTarget = $('.' + activePanelClassName);
    var target = $('.' + item.data('target'));

    hasVelocity ?
      currentTarget.velocity('transition.slideUpOut', TAB_ANIMATE_DURATION, function () {
        target
          .velocity('stop')
          .velocity('transition.slideDownIn', TAB_ANIMATE_DURATION)
          .addClass(activePanelClassName);
      }) :
      currentTarget.animate({ opacity: 0 }, TAB_ANIMATE_DURATION, function () {
        currentTarget.hide();
        target
          .stop()
          .css({'opacity': 0, 'display': 'block'})
          .animate({ opacity: 1 }, TAB_ANIMATE_DURATION, function () {
            currentTarget.removeClass(activePanelClassName);
            target.addClass(activePanelClassName);
          });
      });

    item.siblings().removeClass(activeTabClassName);
    item.addClass(activeTabClassName);
  });

  // TOC item animation navigate & prevent #item selector in adress bar.
  $('.post-toc a').on('click', function (e) {
    e.preventDefault();
    var href = this.getAttribute('href');
    var target = href && href.charAt(0) === '#' ?
      document.getElementById(decodeURIComponent(href.substring(1))) :
      null;

    if (!target) return;

    var sidebarOffset = (CONFIG.sidebar && CONFIG.sidebar.offset) || 0;
    var scrollOffset = Math.max(sidebarOffset + 120, 140);
    var offset = $(target).offset().top - scrollOffset;

    hasVelocity
      ? html.velocity('stop').velocity('scroll', {
        offset  : offset + 'px',
        mobileHA: false
      })
      : $('html, body').stop().animate({
        scrollTop: offset
      }, 500);
  });

  // Expand sidebar on post detail page by default, when post has a toc.
  var $tocContent = $('.post-toc-content');
  var isSidebarCouldDisplay = CONFIG.sidebar.display === 'post' ||
      CONFIG.sidebar.display === 'always';
  var hasTOC = $tocContent.length > 0 && $tocContent.html().trim().length > 0;
  if (isSidebarCouldDisplay && hasTOC) {
    CONFIG.motion.enable ?
      (NexT.motion.middleWares.sidebar = function () {
          NexT.utils.displaySidebar();
      }) : NexT.utils.displaySidebar();
  }
});
