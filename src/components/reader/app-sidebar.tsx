"use client";

import * as React from "react";
import { BookOpenText, Lock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { BookData } from "@/lib/types";

/** Орнамент «геометрический ромб» — системный знак дизайн-системы. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden="true"
    >
      <rect x="7" y="7" width="10" height="10" />
      <rect x="7" y="7" width="10" height="10" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AppSidebar({
  book,
  activeSection,
}: {
  book: BookData;
  activeSection: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const active = book.chapters.find((c) => !c.wip) ?? book.chapters[0];

  const scrollTo = (id: string) => {
    if (isMobile) setOpenMobile(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Sidebar collapsible="icon">
      {/* Книга */}
      <SidebarHeader className="p-0 pb-1">
        <div className="px-3 pt-3 pb-2 flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="flex-none w-9 h-9 grid place-items-center rounded-xl bg-primary/15 text-primary">
            <Ornament className="w-5 h-5" />
          </span>
          <div className="group-data-[collapsible=icon]:hidden min-w-0">
            <p className="font-serif font-bold text-[17px] leading-tight">
              {book.meta.titleRu}
            </p>
            <p className="font-arabic text-lg leading-none text-primary mt-0.5" dir="rtl" lang="ar">
              {book.meta.titleAr}
            </p>
          </div>
        </div>
        <p className="px-6 pb-2 text-xs text-muted-foreground leading-snug group-data-[collapsible=icon]:hidden">
          {book.meta.authorRu} · {book.meta.authorNote}
        </p>
      </SidebarHeader>

      {/* Разделы книги */}
      <SidebarContent className="nice-scroll">
        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Активный раздел */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  tooltip={active.title}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <BookOpenText className="text-primary" />
                  <span className="truncate">
                    {active.num}. {active.title}
                  </span>
                </SidebarMenuButton>
                {active.sections.length > 0 ? (
                  <SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
                    {active.sections.map((s) => (
                      <SidebarMenuSubItem key={s.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={activeSection === s.id}
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => scrollTo(s.id)}
                          >
                            <span className="flex-none font-mono text-[10px] leading-none text-muted-foreground">
                              {s.num}
                            </span>
                            <span className="truncate">{s.title}</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>

              {/* Разделы в подготовке */}
              {book.chapters
                .filter((c) => c.wip)
                .map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton disabled tooltip={`${c.num}. ${c.title}`}>
                      <Lock />
                      <span className="truncate">{c.num}. {c.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg border bg-muted/40 px-3 py-2.5 mx-2 mb-2">
          <p className="text-[11px] font-bold">MVP · три слоя</p>
          <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
            Книга → Разбор → Атлас. Переключатель — в шапке.
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
