const PRICE = 34;
const DUO_PRICE = 61.2;
const FREE_SHIPPING_THRESHOLD = 50;
const PACK_PRICES = { solo: 34, duo: 61.2 };
const PACK_SIZES = { solo: 1, duo: 2 };

const drawer = document.querySelector(".cart-drawer");
const backdrop = document.querySelector(".cart-backdrop");
const cartCount = document.querySelector(".cart-count");
const cartItems = document.querySelector(".cart-items");
const subtotal = document.querySelector(".cart-subtotal strong");
const shippingMessage = document.querySelector(".shipping-message");
const shippingProgress = document.querySelector(".shipping-track span");
const checkoutNote = document.querySelector(".checkout-note");
const toast = document.querySelector(".toast");
const upsellOverlay = document.querySelector(".upsell-overlay");
const upsellDialog = document.querySelector(".upsell-dialog");

let quantity = 0;
let selectedPack = "solo";
let packQuantity = 1;
let returnFocusTo = null;
let upsellReturnFocusTo = null;
let pendingSoloQuantity = 0;
let upsellIsClosing = false;
let toastTimeout;

function getTotal(units) {
  const duos = Math.floor(units / 2);
  const singles = units % 2;
  return duos * DUO_PRICE + singles * PRICE;
}

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderCart() {
  const total = getTotal(quantity);
  cartCount.textContent = String(quantity);
  document.querySelector(".cart-trigger").setAttribute("aria-label", `Open shopping bag, ${quantity} items`);
  subtotal.textContent = formatPrice(total);
  drawer.classList.toggle("is-empty", quantity === 0);

  if (quantity > 0) {
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
    shippingMessage.innerHTML = remaining
      ? `You're <strong>${formatPrice(remaining)}</strong> away from free US shipping.`
      : "<strong>You've unlocked free US shipping.</strong> Nice one!";
    shippingProgress.style.width = `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%`;
    cartItems.innerHTML = `
      <article class="cart-line">
        <div class="cart-product-art" aria-hidden="true">STUFFED<br>The Little Fox</div>
        <div class="cart-product-info">
          <strong>The Little Fox</strong>
          <small>${quantity >= 2 ? "Fox friends pricing applied" : "One cuddly fox"}</small>
          <div class="quantity-control" aria-label="Quantity">
            <button type="button" data-quantity="-1" aria-label="Remove one fox">−</button>
            <span aria-live="polite">${quantity}</span>
            <button type="button" data-quantity="1" aria-label="Add one fox">+</button>
          </div>
        </div>
        <span class="cart-line-price">${formatPrice(total)}</span>
      </article>`;
  } else {
    shippingMessage.textContent = "Free US shipping on orders over $50.";
    shippingProgress.style.width = "0%";
    cartItems.innerHTML = "";
  }
}

function renderPack() {
  const setPrice = PACK_PRICES[selectedPack];
  const size = PACK_SIZES[selectedPack];
  const total = setPrice * packQuantity;
  document.querySelectorAll(".pack-option").forEach((option) => {
    const isSelected = option.dataset.pack === selectedPack;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });
  document.querySelector(".pack-count").textContent = `${packQuantity * size} ${packQuantity * size === 1 ? "fox" : "foxes"}`;
  document.querySelector(".pack-quantity").textContent = String(packQuantity);
  document.querySelector(".selected-price").textContent = formatPrice(setPrice);
  document.querySelector(".price-unit").textContent = size === 1
    ? "One very huggable fox"
    : "2 fox friends · save 10%";
  document.querySelector(".button-price").textContent = formatPrice(total);
}

function openCart() {
  returnFocusTo = document.activeElement;
  drawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  document.body.classList.add("cart-open");
  requestAnimationFrame(() => {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-visible");
    drawer.querySelector(".cart-close").focus();
  });
}

function closeCart() {
  drawer.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
  window.setTimeout(() => {
    if (!drawer.classList.contains("is-open")) backdrop.hidden = true;
  }, 300);
  if (returnFocusTo instanceof HTMLElement) returnFocusTo.focus();
}

function addToCart(units, isDuo = false) {
  quantity += units;
  checkoutNote.textContent = "";
  renderCart();
  openCart();
  toast.textContent = isDuo ? "Your fox friends are in the bag." : "The Little Fox is in the bag.";
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function showFoxFriendsOffer(units, trigger) {
  pendingSoloQuantity = units;
  upsellReturnFocusTo = trigger;
  upsellOverlay.hidden = false;
  upsellOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("upsell-open");
  requestAnimationFrame(() => {
    upsellOverlay.classList.add("is-visible");
    upsellDialog.classList.add("is-visible");
    upsellDialog.querySelector(".upsell-accept").focus();
  });
}

function resolveFoxFriendsOffer(addFoxFriends) {
  if (upsellIsClosing || upsellOverlay.hidden) return;
  upsellIsClosing = true;
  upsellOverlay.classList.remove("is-visible");
  upsellDialog.classList.remove("is-visible");
  upsellOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("upsell-open");

  window.setTimeout(() => {
    upsellOverlay.hidden = true;
    upsellIsClosing = false;
    if (upsellReturnFocusTo instanceof HTMLElement) {
      upsellReturnFocusTo.focus();
    }

    if (addFoxFriends) {
      selectedPack = "duo";
      packQuantity = 1;
      renderPack();
      addToCart(PACK_SIZES.duo, true);
      return;
    }

    addToCart(pendingSoloQuantity, false);
  }, 360);
}

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const size = PACK_SIZES[selectedPack];
    if (selectedPack === "solo" && packQuantity === 1) {
      showFoxFriendsOffer(size * packQuantity, button);
      return;
    }
    addToCart(size * packQuantity, true);
  });
});

document.querySelectorAll(".pack-option").forEach((option) => {
  option.addEventListener("click", () => {
    selectedPack = option.dataset.pack;
    packQuantity = 1;
    renderPack();
  });
});

document.querySelector("[data-add-duo]").addEventListener("click", () => {
  selectedPack = "duo";
  packQuantity = 1;
  renderPack();
  addToCart(PACK_SIZES.duo, true);
});

document.querySelector(".upsell-accept").addEventListener("click", () => resolveFoxFriendsOffer(true));
document.querySelector(".upsell-decline").addEventListener("click", () => resolveFoxFriendsOffer(false));
document.querySelector(".upsell-close").addEventListener("click", () => resolveFoxFriendsOffer(false));

document.querySelector(".quantity-picker").addEventListener("click", (event) => {
  const button = event.target.closest("[data-pack-quantity]");
  if (!button) return;
  packQuantity = Math.max(1, packQuantity + Number(button.dataset.packQuantity));
  renderPack();
});

document.querySelector(".cart-trigger").addEventListener("click", openCart);
document.querySelector(".cart-close").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);

const menuToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open menu" : "Close menu");
  mainNav.classList.toggle("is-open", !isExpanded);
});

mainNav.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  mainNav.classList.remove("is-open");
});

function wireMotionToggle(buttonSelector, trackSelector, pausedLabel, runningLabel) {
  const button = document.querySelector(buttonSelector);
  const track = document.querySelector(trackSelector);
  button.addEventListener("click", () => {
    const isPaused = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isPaused));
    button.setAttribute("aria-label", isPaused ? pausedLabel : runningLabel);
    if (buttonSelector === ".reviews-motion-toggle") {
      button.textContent = isPaused ? "Pause reviews" : "Play reviews";
    }
    track.style.animationPlayState = isPaused ? "running" : "paused";
  });
}

wireMotionToggle(".sale-motion-toggle", ".sale-track", "Pause sale ticker", "Play sale ticker");
wireMotionToggle(".reviews-motion-toggle", ".review-track", "Pause review carousel", "Play review carousel");

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  quantity = Math.max(0, quantity + Number(button.dataset.quantity));
  renderCart();
  renderPack();
});

document.addEventListener("keydown", (event) => {
  if (!upsellOverlay.hidden && !upsellIsClosing) {
    if (event.key === "Escape") {
      event.preventDefault();
      resolveFoxFriendsOffer(false);
      return;
    }
    if (event.key === "Tab") {
      const focusable = [...upsellDialog.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    return;
  }

  if (!drawer.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    closeCart();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...drawer.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelector(".checkout-button").addEventListener("click", () => {
  checkoutNote.textContent = "This is a storefront preview. Connect your Shopify checkout before taking orders.";
});

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const message = document.querySelector(".form-message");
  message.textContent = "Thanks! Connect your email platform to collect sign-ups.";
  event.currentTarget.reset();
});

renderCart();
