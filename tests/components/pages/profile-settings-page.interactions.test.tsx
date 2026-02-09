import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileSettings from "../../../client/src/pages/profile-settings";
import {
  createTestQueryClient,
  renderWithProviders,
} from "../utils/renderWithProviders";

const toastMock = vi.hoisted(() => vi.fn());
const apiRequestMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/lib/queryClient", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  queryClient: {
    invalidateQueries: (...args: unknown[]) => invalidateQueriesMock(...args),
  },
}));

vi.mock("@/components/profile/ProfileForm", () => ({
  ProfileForm: ({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <button data-testid="submit-profile" onClick={() => onSubmit({ firstName: "Kevin" })}>
      Submit Profile
    </button>
  ),
}));

vi.mock("@/components/profile/PreferencesForm", () => ({
  PreferencesForm: ({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <button data-testid="submit-preferences" onClick={() => onSubmit({ theme: "dark" })}>
      Submit Preferences
    </button>
  ),
}));

vi.mock("@/components/profile/NotificationSettingsForm", () => ({
  NotificationSettingsForm: ({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <button data-testid="submit-notifications" onClick={() => onSubmit({ emailNotifications: true })}>
      Submit Notifications
    </button>
  ),
}));

vi.mock("@/components/profile/SecuritySettings", () => ({
  SecuritySettings: () => <div data-testid="security-settings">Security Panel</div>,
}));

describe("ProfileSettings page interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile settings tabs and security panel", async () => {
    const queryClient = createTestQueryClient({
      "/api/profile/me": {
        id: "user-1",
        email: "kevin@example.com",
        firstName: "Kevin",
        lastName: "Herrera",
        profileImageUrl: null,
        role: "admin",
        phoneNumber: null,
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        profilePreferences: {},
        notificationSettings: {},
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<ProfileSettings />, { queryClient });

    expect(await screen.findByTestId("text-page-title")).toHaveTextContent(/profile & settings/i);

    await user.click(screen.getByTestId("tab-security"));
    expect(screen.getByTestId("security-settings")).toBeInTheDocument();
  });

  it("submits profile/preferences/notification mutations and shows success toasts", async () => {
    const queryClient = createTestQueryClient({
      "/api/profile/me": {
        id: "user-1",
        email: "kevin@example.com",
        firstName: "Kevin",
        lastName: "Herrera",
        profileImageUrl: null,
        role: "admin",
        phoneNumber: null,
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        profilePreferences: {},
        notificationSettings: {},
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
      },
    });
    apiRequestMock.mockResolvedValue({});

    const user = userEvent.setup();
    renderWithProviders(<ProfileSettings />, { queryClient });

    await user.click(await screen.findByTestId("submit-profile"));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/profile/me",
        "PATCH",
        expect.anything()
      );
    });

    await user.click(screen.getByTestId("tab-preferences"));
    await user.click(screen.getByTestId("submit-preferences"));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/profile/me/preferences",
        "PATCH",
        expect.anything()
      );
    });

    await user.click(screen.getByTestId("tab-notifications"));
    await user.click(screen.getByTestId("submit-notifications"));
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/profile/me/notifications",
        "PATCH",
        expect.anything()
      );
    });

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: ["/api/profile/me"],
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Profile Updated" })
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Preferences Updated" })
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Notification Settings Updated" })
    );
  });
});
