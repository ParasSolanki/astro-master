import { createEffect, createSignal, onCleanup } from "solid-js";
import { Show, Portal } from "solid-js/web";
import type { DOMElement } from "solid-js/jsx-runtime";
import { authSchema } from "../actions/schema";
import type { User } from "../server/auth";

type UserMenuProps = {
  user?: User;
};

export function UserMenu(props: UserMenuProps) {
  const [user] = createSignal(props.user);
  const [open, setOpen] = createSignal(false);
  let modalRef = undefined as HTMLDivElement | undefined;

  createEffect(() => {
    document.body.style.overflow = open() ? "hidden" : "auto";
  });

  createEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && open()) {
          setOpen(false);
        }
      },
      { signal: controller.signal },
    );

    onCleanup(() => {
      controller.abort();
    });
  });

  return (
    <div ref={(el) => (modalRef = el)} class="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-controls="auth-dialog"
        data-state={open() ? "open" : "closed"}
        aria-expanded={open() ? "true" : "false"}
        onClick={() => setOpen(!open())}
        class="inline-flex items-center"
      >
        {user() ? user()?.username : "Login"}

        <svg
          class="ml-1 size-4"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <Show when={open()}>
        <Portal mount={modalRef}>
          <div
            id="auth-dialog"
            role="dialog"
            class="absolute right-0 top-full z-10 bg-white p-4 shadow"
            data-state={open() ? "open" : "closed"}
          >
            <Show when={user()}>
              <form method="post" action="/api/auth/logout">
                <button
                  type="submit"
                  class="border border-yellow-500 p-2 text-yellow-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Logout
                </button>
              </form>
            </Show>
            <Show when={!user()}>
              <h3 class="text-base font-semibold text-yellow-500">Log in</h3>

              <AuthForm />
            </Show>
          </div>
        </Portal>
      </Show>
    </div>
  );
}

type Errors = Record<string, string[] | undefined> | undefined;

function AuthForm() {
  const [errors, setErrors] = createSignal<Errors>(undefined);
  const [pending, setPending] = createSignal(false);

  async function handleSubmit(
    event: SubmitEvent & {
      currentTarget: HTMLFormElement;
      target: DOMElement;
    },
  ) {
    event.preventDefault();

    setPending(false);
    setErrors(undefined);

    const formData = new FormData(event.currentTarget, event.submitter);
    const result = authSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setPending(true);

    const response = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify(result.data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    setPending(false);

    if (!response.ok) {
      const json = await response.json();
      setErrors({
        root: json && json.message ? json.message : "Something went wrong",
      });
      return;
    }

    window.location.reload();
  }

  return (
    <form
      class="aria-disabled:opacity-50"
      onSubmit={handleSubmit}
      aria-disabled={pending()}
      aria-invalid={!!errors()}
    >
      <Show when={errors()?.root}>
        <div class="text-xs text-red-500">{errors()?.root}</div>
      </Show>

      <fieldset
        class="flex flex-col space-y-2"
        disabled={pending()}
        aria-disabled={pending()}
        aria-invalid={!!errors()}
      >
        <div class="space-y-1">
          <label
            for="username"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Username"
            class="border border-gray-500 p-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500"
            autofocus
            required
            aria-placeholder="Username"
            autocomplete="false"
            aria-required="true"
            aria-invalid={errors()?.username ? "true" : "false"}
            aria-describedby={errors()?.username ? "username-error" : undefined}
          />

          <Show when={errors()?.username}>
            <div id="username-error" class="text-xs text-red-500">
              {errors()?.username}
            </div>
          </Show>
        </div>

        <div class="space-y-1">
          <label
            for="password"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            class="border border-gray-500 p-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500"
            autocomplete="false"
            required
            aria-required="true"
            aria-placeholder="Password"
            aria-invalid={errors()?.password ? "true" : "false"}
            aria-describedby={errors()?.password ? "password-error" : undefined}
          />

          <Show when={errors()?.password}>
            <div id="password-error" class="text-xs text-red-500">
              {errors()?.password}
            </div>
          </Show>
        </div>

        <button
          type="submit"
          name="action"
          value="login"
          class="bg-yellow-500 p-2 text-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending()}
          aria-disabled={pending()}
          aria-busy={pending()}
        >
          Login
        </button>
        <button
          type="submit"
          name="action"
          value="signup"
          class="border border-yellow-500 p-2 text-yellow-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending()}
          aria-disabled={pending()}
          aria-busy={pending()}
        >
          Create Login
        </button>
      </fieldset>
    </form>
  );
}
