"use client";

import React from "react";

type Props = { children: React.ReactNode };

export default class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.warn("PostFX error caught:", error, info);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children as React.ReactElement;
  }
}
