let scriptPromise;
let initializedToken;
let eventHandler;

function loadPaddle() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timeout = window.setTimeout(fail, 15000);
      function fail() {
        window.clearTimeout(timeout);
        script.remove();
        scriptPromise = null;
        reject(new Error("Não foi possível carregar o checkout. Confira sua conexão e tente novamente."));
      }
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => {
        window.clearTimeout(timeout);
        if (window.Paddle) resolve(window.Paddle);
        else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function createCheckout(token) {
  const response = await fetch("/api/usuarios/me/assinatura/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.erro || "Não foi possível preparar o checkout de teste.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function openSandboxCheckout(checkout, onEvent) {
  if (checkout.environment !== "sandbox" || !checkout.client_token?.startsWith("test_")
      || !/^txn_[a-z0-9]{26}$/.test(checkout.transaction_id || "")) {
    throw new Error("O checkout foi bloqueado: são permitidas somente configurações de sandbox.");
  }
  const paddle = await loadPaddle();
  if (initializedToken && initializedToken !== checkout.client_token) {
    throw new Error("A configuração do checkout mudou. Recarregue a página antes de continuar.");
  }
  if (!initializedToken) {
    paddle.Environment.set("sandbox");
    paddle.Initialize({ token: checkout.client_token, eventCallback: event => eventHandler?.(event) });
    initializedToken = checkout.client_token;
  }
  eventHandler = onEvent;
  paddle.Checkout.open({
    transactionId: checkout.transaction_id,
    settings: { displayMode: "overlay", theme: "light", locale: "pt-BR",
                allowedPaymentMethods: ["card"], showAddDiscounts: false, allowLogout: false },
  });
  return () => {
    if (eventHandler === onEvent) {
      eventHandler = undefined;
      paddle.Checkout.close();
    }
  };
}
