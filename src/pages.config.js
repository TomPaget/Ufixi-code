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

const BusinessPricing = lazy(() => import('./pages/BusinessPricing'));
const BusinessSignup = lazy(() => import('./pages/BusinessSignup'));
const Chat = lazy(() => import('./pages/Chat'));
const ConsultationSummary = lazy(() => import('./pages/ConsultationSummary'));
const ContractorManagement = lazy(() => import('./pages/ContractorManagement'));
const Contractors = lazy(() => import('./pages/Contractors'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const FindTradesmen = lazy(() => import('./pages/FindTradesmen'));
const Forum = lazy(() => import('./pages/Forum'));
const ForumPost = lazy(() => import('./pages/ForumPost'));
const History = lazy(() => import('./pages/History'));
const Home = lazy(() => import('./pages/Home'));
const HomeProfile = lazy(() => import('./pages/HomeProfile'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Invoices = lazy(() => import('./pages/Invoices'));
const IssueDetail = lazy(() => import('./pages/IssueDetail'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const Landing = lazy(() => import('./pages/Landing'));
const Messages = lazy(() => import('./pages/Messages'));
const MyJobs = lazy(() => import('./pages/MyJobs'));
const Notifications = lazy(() => import('./pages/Notifications'));
const PostJob = lazy(() => import('./pages/PostJob'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const PropertyIssues = lazy(() => import('./pages/PropertyIssues'));
const Settings = lazy(() => import('./pages/Settings'));
const Support = lazy(() => import('./pages/Support'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const TradesBoost = lazy(() => import('./pages/TradesBoost'));
const TradesDashboard = lazy(() => import('./pages/TradesDashboard'));
const TradesPayment = lazy(() => import('./pages/TradesPayment'));
const TradesPending = lazy(() => import('./pages/TradesPending'));
const TradesProfile = lazy(() => import('./pages/TradesProfile'));
const TradesSignup = lazy(() => import('./pages/TradesSignup'));
const TradesSuccess = lazy(() => import('./pages/TradesSuccess'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "BusinessPricing": BusinessPricing,
    "BusinessSignup": BusinessSignup,
    "Chat": Chat,
    "ConsultationSummary": ConsultationSummary,
    "ContractorManagement": ContractorManagement,
    "Contractors": Contractors,
    "CreatePost": CreatePost,
    "FindTradesmen": FindTradesmen,
    "Forum": Forum,
    "ForumPost": ForumPost,
    "History": History,
    "Home": Home,
    "HomeProfile": HomeProfile,
    "Integrations": Integrations,
    "Invoices": Invoices,
    "IssueDetail": IssueDetail,
    "JobDetail": JobDetail,
    "Landing": Landing,
    "Messages": Messages,
    "MyJobs": MyJobs,
    "Notifications": Notifications,
    "PostJob": PostJob,
    "PropertyDetail": PropertyDetail,
    "PropertyIssues": PropertyIssues,
    "Settings": Settings,
    "Support": Support,
    "TeamManagement": TeamManagement,
    "TradesBoost": TradesBoost,
    "TradesDashboard": TradesDashboard,
    "TradesPayment": TradesPayment,
    "TradesPending": TradesPending,
    "TradesProfile": TradesProfile,
    "TradesSignup": TradesSignup,
    "TradesSuccess": TradesSuccess,
    "Upgrade": Upgrade,
    "VideoCall": VideoCall,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};