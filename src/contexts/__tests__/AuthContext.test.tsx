import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";

// --- Supabase mock -----------------------------------------------------------

type AuthChangeCallback = (event: string, session: any) => void;
let authChangeCallback: AuthChangeCallback | null = null;
const unsubscribeMock = vi.fn();

const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (cb: AuthChangeCallback) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: unsubscribeMock } } };
      },
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => mockSelect(),
      }),
    }),
  },
}));

// --- Helpers -----------------------------------------------------------------

function TestConsumer() {
  const { user, loading, rolesLoaded, roles } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="rolesLoaded">{String(rolesLoaded)}</span>
      <span data-testid="user">{user ? user.id : "null"}</span>
      <span data-testid="roles">{JSON.stringify(roles)}</span>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

const fakeUser = { id: "user-123" } as any;
const fakeSession = { user: fakeUser } as any;

// --- Tests -------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  authChangeCallback = null;
  vi.clearAllMocks();
  // Default: roles query returns empty array
  mockSelect.mockResolvedValue({ data: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AuthProvider", () => {
  it("sets loading=false and rolesLoaded=true when there is no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("rolesLoaded").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("fetches roles and then sets loading=false when session exists", async () => {
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockSelect.mockResolvedValue({
      data: [{ role: "member", gym_id: null }],
    });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("rolesLoaded").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("user-123");
    expect(screen.getByTestId("roles").textContent).toContain("member");
  });

  it("ignores SIGNED_IN from onAuthStateChange during initial load (race condition fix)", async () => {
    // getSession resolves with a session but after a short delay
    let resolveGetSession: (val: any) => void;
    mockGetSession.mockReturnValue(
      new Promise((resolve) => {
        resolveGetSession = resolve;
      }),
    );
    mockSelect.mockResolvedValue({
      data: [{ role: "trainer", gym_id: null }],
    });

    await act(async () => {
      renderWithProvider();
    });

    // loading is still true because getSession hasn't resolved yet
    expect(screen.getByTestId("loading").textContent).toBe("true");

    // Simulate onAuthStateChange firing SIGNED_IN before getSession resolves
    // (this is the race condition scenario on page refresh)
    await act(async () => {
      authChangeCallback?.("SIGNED_IN", fakeSession);
    });

    // Loading should STILL be true — the SIGNED_IN event must be ignored
    // because initialLoadDone is false
    expect(screen.getByTestId("loading").textContent).toBe("true");

    // Now resolve getSession — this should trigger the actual data fetch
    await act(async () => {
      resolveGetSession!({ data: { session: fakeSession } });
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("rolesLoaded").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("user-123");
  });

  it("handles SIGNED_IN after initial load is done (fresh sign-in)", async () => {
    // Initial load — no session
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");

    // Now simulate a fresh sign-in via onAuthStateChange
    mockSelect.mockResolvedValue({
      data: [{ role: "gym_admin", gym_id: null }],
    });

    await act(async () => {
      authChangeCallback?.("SIGNED_IN", fakeSession);
    });

    expect(screen.getByTestId("user").textContent).toBe("user-123");
    expect(screen.getByTestId("roles").textContent).toContain("gym_admin");
  });

  it("clears state on SIGNED_OUT", async () => {
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockSelect.mockResolvedValue({
      data: [{ role: "member", gym_id: null }],
    });

    await act(async () => {
      renderWithProvider();
    });

    expect(screen.getByTestId("user").textContent).toBe("user-123");

    // Sign out
    await act(async () => {
      authChangeCallback?.("SIGNED_OUT", null);
    });

    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("roles").textContent).toBe("[]");
    expect(screen.getByTestId("rolesLoaded").textContent).toBe("true");
  });

  it("safety timeout sets rolesLoaded and loading after 5 seconds", async () => {
    // getSession never resolves — simulates a hung request
    mockGetSession.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      renderWithProvider();
    });

    // Still loading
    expect(screen.getByTestId("loading").textContent).toBe("true");

    // Advance timers by 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Safety timeout should have fired
    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("rolesLoaded").textContent).toBe("true");
  });
});
