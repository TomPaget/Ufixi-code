/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
import BusinessPricing from './pages/BusinessPricing';
import BusinessSignup from './pages/BusinessSignup';
import Landing from './pages/Landing';
import Home from './pages/Home';
import __Layout from './Layout.jsx';

// Lazy-load non-critical pages for better performance
const LazyChat = lazy(() => import('./pages/Chat'));
const LazyConsultationSummary = lazy(() => import('./pages/ConsultationSummary'));
const LazyContractorManagement = lazy(() => import('./pages/ContractorManagement'));
const LazyContractors = lazy(() => import('./pages/Contractors'));
const LazyCreatePost = lazy(() => import('./pages/CreatePost'));
const LazyFindTradesmen = lazy(() => import('./pages/FindTradesmen'));
const LazyForum = lazy(() => import('./pages/Forum'));
const LazyForumPost = lazy(() => import('./pages/ForumPost'));
const LazyHistory = lazy(() => import('./pages/History'));
const LazyHomeProfile = lazy(() => import('./pages/HomeProfile'));
const LazyIntegrations = lazy(() => import('./pages/Integrations'));
const LazyInvoices = lazy(() => import('./pages/Invoices'));
const LazyIssueDetail = lazy(() => import('./pages/IssueDetail'));
const LazyJobDetail = lazy(() => import('./pages/JobDetail'));
const LazyMessages = lazy(() => import('./pages/Messages'));
const LazyMyJobs = lazy(() => import('./pages/MyJobs'));
const LazyNotifications = lazy(() => import('./pages/Notifications'));
const LazyPostJob = lazy(() => import('./pages/PostJob'));
const LazyPropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const LazyPropertyIssues = lazy(() => import('./pages/PropertyIssues'));
const LazySettings = lazy(() => import('./pages/Settings'));
const LazySupport = lazy(() => import('./pages/Support'));
const LazyTeamManagement = lazy(() => import('./pages/TeamManagement'));
const LazyTradesBoost = lazy(() => import('./pages/TradesBoost'));
const LazyTradesDashboard = lazy(() => import('./pages/TradesDashboard'));
const LazyTradesPayment = lazy(() => import('./pages/TradesPayment'));
const LazyTradesPending = lazy(() => import('./pages/TradesPending'));
const LazyTradesProfile = lazy(() => import('./pages/TradesProfile'));
const LazyTradesSignup = lazy(() => import('./pages/TradesSignup'));
const LazyTradesSuccess = lazy(() => import('./pages/TradesSuccess'));
const LazyUpgrade = lazy(() => import('./pages/Upgrade'));
const LazyVideoCall = lazy(() => import('./pages/VideoCall'));
const LazyEmailTradesman = lazy(() => import('./pages/EmailTradesman'));
const LazyDataInsights = lazy(() => import('./pages/DataInsights'));
const LazyMyIssues = lazy(() => import('./pages/MyIssues'));

export const PAGES = {
    "BusinessPricing": BusinessPricing,
    "BusinessSignup": BusinessSignup,
    "Chat": LazyChat,
    "ConsultationSummary": LazyConsultationSummary,
    "ContractorManagement": LazyContractorManagement,
    "Contractors": LazyContractors,
    "CreatePost": LazyCreatePost,
    "FindTradesmen": LazyFindTradesmen,
    "Forum": LazyForum,
    "ForumPost": LazyForumPost,
    "History": LazyHistory,
    "HomeProfile": LazyHomeProfile,
    "Integrations": LazyIntegrations,
    "Invoices": LazyInvoices,
    "IssueDetail": LazyIssueDetail,
    "JobDetail": LazyJobDetail,
    "Landing": Landing,
    "Messages": LazyMessages,
    "MyJobs": LazyMyJobs,
    "Notifications": LazyNotifications,
    "PostJob": LazyPostJob,
    "PropertyDetail": LazyPropertyDetail,
    "PropertyIssues": LazyPropertyIssues,
    "Settings": LazySettings,
    "Support": LazySupport,
    "TeamManagement": LazyTeamManagement,
    "TradesBoost": LazyTradesBoost,
    "TradesDashboard": LazyTradesDashboard,
    "TradesPayment": LazyTradesPayment,
    "TradesPending": LazyTradesPending,
    "TradesProfile": LazyTradesProfile,
    "TradesSignup": LazyTradesSignup,
    "TradesSuccess": LazyTradesSuccess,
    "Upgrade": LazyUpgrade,
    "VideoCall": LazyVideoCall,
    "EmailTradesman": LazyEmailTradesman,
    "DataInsights": LazyDataInsights,
    "MyIssues": LazyMyIssues,
    "Home": Home,
};

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};