import { describe, expect, it } from "vitest";
import { GetValidURLTemplateUtil } from "~/shared/logic/project/GetValidURLTemplateUtil";

describe("GetValidURLTemplateUtil", () => {
  it("should ensure the URL starts with https:// if it doesn't already", () => {
    const result = GetValidURLTemplateUtil("example.com");
    expect(result).toBe("https://example.com/");
  });

  it("should not modify the URL if it already starts with https://", () => {
    const result = GetValidURLTemplateUtil("https://example.com");
    expect(result).toBe("https://example.com/");
  });

  it("should ensure the URL ends with a slash if it doesn't already", () => {
    const result = GetValidURLTemplateUtil("https://example.com");
    expect(result).toBe("https://example.com/");
  });

  it("should not modify the URL if it already ends with a slash", () => {
    const result = GetValidURLTemplateUtil("https://example.com/");
    expect(result).toBe("https://example.com/");
  });

  it("should add both https:// and a slash if neither are present", () => {
    const result = GetValidURLTemplateUtil("example.com");
    expect(result).toBe("https://example.com/");
  });

  it("should handle URLs that already have both https:// and a slash", () => {
    const result = GetValidURLTemplateUtil("https://example.com/");
    expect(result).toBe("https://example.com/");
  });

  it("should return empty if the URL is empty", () => {
    const result = GetValidURLTemplateUtil("");
    expect(result).toBe("");
  });

  it("should handle URLs with subdomains correctly", () => {
    const result = GetValidURLTemplateUtil("sub.example.com");
    expect(result).toBe("https://sub.example.com/");
  });

  it("should handle URLs with paths correctly", () => {
    const result = GetValidURLTemplateUtil("example.com/path");
    expect(result).toBe("https://example.com/path/");
  });

  it("should handle URLs with query parameters correctly", () => {
    const result = GetValidURLTemplateUtil("example.com/path?query=1");
    expect(result).toBe("https://example.com/path?query=1/");
  });
});
