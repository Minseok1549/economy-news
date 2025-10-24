import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Innera.kr - 이너뷰티 & 클린뷰티 정보 플랫폼",
  description: "피부와 마음이 피어나는 시대, Innera.kr 🌿 이너뷰티 · 클린뷰티 · 뷰티 인포랩",
  keywords: "이너뷰티, 클린뷰티, 뷰티인포, 건강기능식품, 스킨케어, 화장품, 뷰티트렌드, Innera, Innera.kr, 이너라",
};

export default function SupplementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}