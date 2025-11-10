"use client";

import Link from "next/link";
import { HomeIcon } from "lucide-react";
import React from "react";
import {
  useBreadcrumbs,
  getDisplayTitle,
  type PathSegment,
} from "@/hooks/useBreadcrumbs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbItemLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";

// 静的データをサーバーから取得するためのプロップスタイプ
export interface BreadcrumbNavProps {
  blogTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
  bookTitleMap: Record<string, string>;
}

export default function BreadcrumbNav(props: BreadcrumbNavProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");
  const { pathSegments, data } = useBreadcrumbs(props);

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbItemLink asChild>
            <Link href="/" aria-label={t("breadcrumb.home")}>
              <HomeIcon className="h-4 w-4" />
            </Link>
          </BreadcrumbItemLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {pathSegments.map((segment) => (
          <React.Fragment key={segment.path}>
            <BreadcrumbItem>
              {segment.isLast || !segment.shouldLink ? (
                <BreadcrumbItemLink
                  asChild
                  variant={segment.isLast ? "active" : "default"}
                >
                  <span aria-current={segment.isLast ? "page" : undefined}>
                    {getDisplayTitle({ segment, data, t })}
                  </span>
                </BreadcrumbItemLink>
              ) : (
                <BreadcrumbItemLink asChild>
                  <Link href={segment.path}>
                    {getDisplayTitle({ segment, data, t })}
                  </Link>
                </BreadcrumbItemLink>
              )}
            </BreadcrumbItem>
            {!segment.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
