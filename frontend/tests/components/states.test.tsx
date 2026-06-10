import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

describe("EmptyState", () => {
  it("renders title, description, and action", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Nothing here"
        description="Try adding something."
        action={<button>Add</button>}
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Try adding something.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders title, message, and hint", () => {
    render(
      <ErrorState
        title="Could not load"
        message="Connection refused"
        hint="Check the database."
      />,
    );
    expect(screen.getByText("Could not load")).toBeInTheDocument();
    expect(screen.getByText("Connection refused")).toBeInTheDocument();
    expect(screen.getByText("Check the database.")).toBeInTheDocument();
  });

  it("uses a default title", () => {
    render(<ErrorState message="boom" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
