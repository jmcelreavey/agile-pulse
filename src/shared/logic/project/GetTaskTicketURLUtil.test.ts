import { describe, expect, it } from "vitest";
import { GetTaskTicketURLUtil } from "~/shared/logic/project/GetTaskTicketURLUtil";

describe("GetTaskTicketURLUtil", () => {
  it("should return the correct URL when the task contains the ticket number with the prefix", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "TICKET-",
      task: "Fix bug TICKET-123 in the system",
    });
    expect(result).toBe("https://tickets.example.com/TICKET-123");
  });

  it("should return an empty string if the task does not contain the ticket number with the prefix", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "TICKET-",
      task: "Fix bug in the system",
    });
    expect(result).toBe("");
  });

  it("should handle case insensitivity for the ticket prefix", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "ticket-",
      task: "Fix bug TICKET-123 in the system",
    });
    expect(result).toBe("https://tickets.example.com/TICKET-123");
  });

  it("should return the correct URL when the ticket number is at the beginning of the task", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "TICKET-",
      task: "TICKET-123 Fix bug in the system",
    });
    expect(result).toBe("https://tickets.example.com/TICKET-123");
  });

  it("should return the correct URL when the ticket number is at the end of the task", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "TICKET-",
      task: "Fix bug in the system TICKET-123",
    });
    expect(result).toBe("https://tickets.example.com/TICKET-123");
  });

  it("should return an empty string if the ticket prefix is not found in the task", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "TICKET-",
      task: "Fix bug in the system TKT-123",
    });
    expect(result).toBe("");
  });

  it("should return an empty string if the task is empty", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "TICKET-",
      task: "",
    });
    expect(result).toBe("");
  });

  it("should return an empty string if the ticketUrlTemplate is empty", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "",
      ticketUrlPrefix: "TICKET-",
      task: "Fix bug TICKET-123 in the system",
    });
    expect(result).toBe("");
  });

  it("should return an empty string if the ticketUrlPrefix is empty", () => {
    const result = GetTaskTicketURLUtil({
      ticketUrlTemplate: "https://tickets.example.com/",
      ticketUrlPrefix: "",
      task: "Fix bug TICKET-123 in the system",
    });
    expect(result).toBe("");
  });
});
