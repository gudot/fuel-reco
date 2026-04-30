import Image from "next/image";
import Link from "next/link";

export default function MainFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "#043000",
        color: "#fff",
        borderTop: "4px solid rgba(94, 13, 13, 0.9)",
      }}
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "1.5rem 2rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Image
            src="/fpIcon.png"
            alt="First Pack Marketing"
            height={60}
            width={60}
            style={{
              height: "auto",
              width: "auto",
              objectFit: "contain",
              borderRadius: "5px",
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                lineHeight: 1.2,
              }}
            >
              First Pack Marketing
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.2,
                marginTop: "0.15rem",
              }}
            >
              For First Class Experience
            </div>
          </div>
        </div>

        {/* Socials */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <SocialLink
            href="https://www.facebook.com/firstpackmarketing3/"
            label="Facebook"
            bg="#1877F2"
            shadow="rgba(24, 119, 242, 0.35)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </SocialLink>

          <SocialLink
            href="https://www.instagram.com/firstpack_zw/"
            label="Instagram"
            bg="linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
            shadow="rgba(220, 39, 67, 0.35)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </SocialLink>

          <SocialLink
            href="https://www.tiktok.com/@firstpackmarketing/"
            label="TikTok"
            bg="#000"
            border="1px solid rgba(255,255,255,0.2)"
            shadow="rgba(0, 0, 0, 0.45)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
          </SocialLink>

          <SocialLink
            href="mailto:enquires@firstpack.co.zw"
            label="Email"
            bg="#E53935"
            shadow="rgba(229, 57, 53, 0.35)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </SocialLink>
        </div>
      </div>

      {/* Copyright bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(0,0,0,0.2)",
          padding: "0.75rem 2rem",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        &copy; {year} First Pack Marketing. All Rights Reserved.
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  bg,
  border,
  shadow,
  children,
}: {
  href: string;
  label: string;
  bg: string;
  border?: string;
  shadow?: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={label}
      title={label}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: bg,
        border: border || "none",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.9,
        transition: "transform 0.2s, opacity 0.2s, box-shadow 0.2s",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px) scale(1.1)";
        e.currentTarget.style.opacity = "1";
        if (shadow) {
          e.currentTarget.style.boxShadow = `0 6px 16px ${shadow}`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </Link>
  );
}

