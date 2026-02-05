"use client";

import client from "@practice-tests-exams-platform/lib/graphql/apollo-client";
import { ReactNode } from "react";
import { ApolloProvider as NextApolloProvider } from "@apollo/client/react";

type RootLayoutProps = {
  children: ReactNode;
};

const ApolloProvider = ({ children }: RootLayoutProps) => {
  return <NextApolloProvider client={client}>{children}</NextApolloProvider>;
};

export default ApolloProvider;
