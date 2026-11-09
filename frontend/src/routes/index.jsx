import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Guard from "../features/auth/Guard";
import Loading from "../components/ui/Loading";

// Lazy-loaded features for code-splitting
const AuthPage = lazy(() => import("../features/auth/AuthPage"));
const VerifyEmail = lazy(() => import("../features/auth/VerifyEmail"));
const Dashboard = lazy(() => import("../features/dashboard/Dashboard"));
const Schemes = lazy(() => import("../features/schemes/Schemes"));
const SchemeDetail = lazy(() => import("../features/schemes/SchemeDetail"));
const Tracker = lazy(() => import("../features/tracker/Tracker"));
const Literacy = lazy(() => import("../features/literacy/Literacy"));
const Profile = lazy(() => import("../features/profile/Profile"));
const Survey = lazy(() => import("../features/survey/Survey"));
const Blogs = lazy(() => import("../features/blogs/Blogs"));
const BlogDetail = lazy(() => import("../features/blogs/BlogDetail"));
const BlogEditor = lazy(() => import("../features/blogs/BlogEditor"));
const Chat = lazy(() => import("../features/chat/Chat"));

function SuspenseFallback() {
  return <Loading text="Loading..." />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          path="/"
          element={
            <Guard>
              <Layout />
            </Guard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="schemes/:slug" element={<SchemeDetail />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="literacy" element={<Literacy />} />
          <Route path="profile" element={<Profile />} />
          <Route path="survey" element={<Survey />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/new" element={<BlogEditor />} />
          <Route path="blogs/:slug" element={<BlogDetail />} />
          <Route path="blogs/:slug/edit" element={<BlogEditor />} />
          <Route path="chat" element={<Chat />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
