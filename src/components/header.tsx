"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/types";

export default function MainHeader({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="main-header"
      style={{
        background: "linear-gradient(90deg, #ffffffef 0%, #ffffff 50%, #fafffd 100%)",
        color: "#180505",
        borderBottom: "4px solid rgba(25, 102, 12, 0.9)",
      }}
    >
      <div className="header-inner">
        <div className="header-brand">
          <Image
            src="/fpIcon.png"
            height={36}
            width={40}
            alt="First Pack Marketing"
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
        </div>
        <div className="header-user">
          <span className="user-name">Hi, {user.name} </span>
          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="button"
            style={{
              padding: "0.5rem 1rem",
              background: "linear-gradient(135deg, #0d5c4d 0%, #147a66 100%)",
              boxShadow: "0 4px 14px rgba(13, 92, 77, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(13, 92, 77, 0.40)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(13, 92, 77, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "0.4rem" }}
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

