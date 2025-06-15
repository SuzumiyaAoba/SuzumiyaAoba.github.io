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

// 静的データをサーバーから取得するためのプロップスタイプ
interface BreadcrumbNavProps {
  blogTitleMap: Record<string, string>;
  noteTitleMap: Record<string, string>;
  keywordTitleMap: Record<string, string>;
  bookTitleMap: Record<string, string>;
}

export default function BreadcrumbNav(props: BreadcrumbNavProps) {
  const { pathSegments, data } = useBreadcrumbs(props);

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbItemLink asChild>
            <Link href="/" aria-label="Home">
              <HomeIcon className="h-4 w-4" />
            </Link>
          </BreadcrumbItemLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {pathSegments.map((segment) => (
          <React.Fragment key={segment.path}>
            <BreadcrumbItem>
              {segment.isLast ? (
                <BreadcrumbItemLink asChild variant="active">
                  <span aria-current="page">
                    {getDisplayTitle({ segment, data })}
                  </span>
                </BreadcrumbItemLink>
              ) : (
                <BreadcrumbItemLink asChild>
                  <Link href={segment.path}>
                    {getDisplayTitle({ segment, data })}
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