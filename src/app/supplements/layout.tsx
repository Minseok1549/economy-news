import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "건강기능식품 추천",
  description: "엄선된 건강기능식품과 영양제를 소개합니다.",
  keywords: "건강기능식품, 영양제, 비타민, 미네랄, 보충제",
};

export default function SupplementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}