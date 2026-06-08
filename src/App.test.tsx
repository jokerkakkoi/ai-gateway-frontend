import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function openApiKeyPage() {
  fireEvent.click(screen.getByRole("link", { name: "API Key" }));
}

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset();
  window.history.pushState({}, "", "/");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText
    }
  });
});

describe("API key management page", () => {
  it("renders sidebar navigation as route links", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "API Key" })).toHaveAttribute("href", "/keys");
  });

  it("opens the API Key page directly from the /keys route", () => {
    window.history.pushState({}, "", "/keys");

    render(<App />);

    expect(screen.getByRole("heading", { name: "API Keys" })).toBeInTheDocument();
    expect(screen.queryByText("Policy Guard")).not.toBeInTheDocument();
  });

  it("updates the browser path when navigating between sections", () => {
    render(<App />);

    openApiKeyPage();

    expect(window.location.pathname).toBe("/keys");
  });

  it.each([
    ["/teams", "团队额度"],
    ["/billing", "账单"],
    ["/models", "模型价格"],
    ["/routing", "路由策略"],
    ["/approvals", "审批"],
    ["/settings", "设置"]
  ])("renders the placeholder page for %s", (path, heading) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("redirects unknown routes to the overview page", async () => {
    window.history.pushState({}, "", "/missing");

    render(<App />);

    expect(await screen.findByText("Policy Guard")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("shows a dedicated API Key page when selected from navigation", () => {
    render(<App />);

    openApiKeyPage();

    expect(screen.getByRole("heading", { name: "API Keys" })).toBeInTheDocument();
    expect(screen.queryByText("Policy Guard")).not.toBeInTheDocument();
  });

  it("closes the mobile sidebar after selecting the API Key page", () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "打开导航" }));
    expect(container.querySelector(".sidebar")?.className).toContain("open");

    openApiKeyPage();

    expect(container.querySelector(".sidebar")?.className).not.toContain("open");
  });

  it("creates a key with only a name and shows the one-time secret", () => {
    render(<App />);

    openApiKeyPage();
    fireEvent.change(screen.getByLabelText("搜索 API Key 或团队"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "创建 API Key" }));
    fireEvent.change(screen.getByLabelText("API Key 名称"), { target: { value: "Notebook Agent" } });
    fireEvent.click(screen.getByRole("button", { name: "创建并显示 Key" }));

    expect(screen.getByText("Notebook Agent")).toBeInTheDocument();
    expect(screen.getByText("只显示一次，请立即复制保存。")).toBeInTheDocument();
    const oneTimeKey = screen.getByText("只显示一次，请立即复制保存。").closest(".one-time-key");
    expect(oneTimeKey).not.toBeNull();
    expect(within(oneTimeKey as HTMLElement).getByText(/^sk-/)).toBeInTheDocument();
  });

  it("copies the original key from a button beside the masked key", () => {
    render(<App />);

    openApiKeyPage();
    const row = screen.getByText("Laptop").closest(".api-key-row");
    expect(row).not.toBeNull();
    expect(row as HTMLElement).toHaveTextContent("sk-45ce0********************a781");
    expect(row as HTMLElement).not.toHaveTextContent("sk-45ce0abcdefghijklmnopqrstuvwxyza781");

    const keyValue = (row as HTMLElement).querySelector(".key-value");
    expect(keyValue).not.toBeNull();
    fireEvent.click(within(keyValue as HTMLElement).getByRole("button", { name: "复制 Laptop 完整 Key" }));

    expect(writeText).toHaveBeenCalledWith("sk-45ce0abcdefghijklmnopqrstuvwxyza781");
  });

  it("edits only the API key name", () => {
    render(<App />);

    openApiKeyPage();
    const row = screen.getByText("Laptop").closest(".api-key-row");
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "编辑 Laptop" }));
    expect(screen.getByLabelText("API Key 名称")).toHaveValue("Laptop");
    expect(screen.queryByLabelText("Key")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("API Key 名称"), { target: { value: "Laptop Dev" } });
    fireEvent.click(screen.getByRole("button", { name: "保存名称" }));

    expect(screen.getByText("Laptop Dev")).toBeInTheDocument();
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();
  });

  it("filters and deletes API keys", () => {
    render(<App />);

    openApiKeyPage();
    fireEvent.change(screen.getByLabelText("搜索 API Key 或团队"), { target: { value: "PCHome" } });
    expect(screen.getByText("PCHome OpenCode")).toBeInTheDocument();
    expect(screen.queryByText("Laptop")).not.toBeInTheDocument();

    const row = screen.getByText("PCHome OpenCode").closest(".api-key-row");
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "删除 PCHome OpenCode" }));
    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    expect(screen.getByText("没有匹配的 API Key")).toBeInTheDocument();
  });
});
