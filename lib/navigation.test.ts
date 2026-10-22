import { describe, expect, it } from "vitest";
import { activeTab, back, backTo, canGoBack, push, showBottomBar, tabStack, type View } from "./navigation";

describe("screen navigation", () => {
  it("back steps to the previous screen and stops at the first one", () => {
    let stack: View[] = ["home"];
    stack = push(stack, "role");
    stack = push(stack, "cart");
    expect(back(stack)).toEqual(["home", "role"]);
    expect(back(["home"])).toEqual(["home"]);
    expect(canGoBack(["home"])).toBe(false);
    expect(canGoBack(["home", "role"])).toBe(true);
  });

  it("doesn't open the same screen twice in a row", () => {
    expect(push(["home", "profile"], "profile")).toEqual(["home", "profile"]);
  });

  it("tabs start a fresh stack, and back from a tab goes Home", () => {
    expect(tabStack("home")).toEqual(["home"]);
    expect(tabStack("shifts")).toEqual(["home", "my-bookings"]);
    expect(tabStack("booking")).toEqual(["home", "cart"]);
    expect(tabStack("crew")).toEqual(["home", "crew"]);
    expect(tabStack("help")).toEqual(["home", "help"]);
    expect(back(tabStack("crew"))).toEqual(["home"]);
  });

  it("after confirming, back goes Home (you can't re-enter payment)", () => {
    const stack: View[] = ["home", "cart", "payment", "bank"];
    const next = push(stack, "confirmed");
    expect(next).toEqual(["home", "confirmed"]);
    expect(back(next)).toEqual(["home"]);
  });

  it("from 'slot unavailable', back goes to Review booking", () => {
    const stack: View[] = ["home", "cart", "payment", "bank"];
    const next = push(stack, "taken");
    expect(next).toEqual(["home", "cart", "taken"]);
    expect(back(next)).toEqual(["home", "cart"]);
  });

  it("can return to an earlier screen directly", () => {
    expect(backTo(["home", "cart", "taken"], "cart")).toEqual(["home", "cart"]);
    expect(backTo(["home", "role"], "cart")).toEqual(["home", "role", "cart"]);
  });

  it("picks the bottom-bar tab to highlight", () => {
    expect(activeTab("home")).toBe("home");
    expect(activeTab("role")).toBe("home");
    expect(activeTab("my-bookings")).toBe("shifts");
    expect(activeTab("booking")).toBe("shifts");
    expect(activeTab("cart")).toBe("booking");
    expect(activeTab("payment")).toBe("booking");
    expect(activeTab("crew")).toBe("crew");
    expect(activeTab("help")).toBe("help");
    expect(activeTab("profile")).toBeNull();
    expect(activeTab("venues")).toBeNull();
  });

  it("hides the bottom bar only while paying", () => {
    expect(showBottomBar("payment")).toBe(false);
    expect(showBottomBar("bank")).toBe(false);
    expect(showBottomBar("cart")).toBe(true);
    expect(showBottomBar("confirmed")).toBe(true);
  });
});
