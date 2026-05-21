import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/livestream")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
