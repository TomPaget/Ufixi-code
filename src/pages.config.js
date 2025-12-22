import Chat from './pages/Chat';
import Contractors from './pages/Contractors';
import CreatePost from './pages/CreatePost';
import FindTradesmen from './pages/FindTradesmen';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import History from './pages/History';
import Home from './pages/Home';
import IssueDetail from './pages/IssueDetail';
import Messages from './pages/Messages';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Support from './pages/Support';
import TradesBoost from './pages/TradesBoost';
import TradesDashboard from './pages/TradesDashboard';
import TradesPayment from './pages/TradesPayment';
import TradesPending from './pages/TradesPending';
import TradesProfile from './pages/TradesProfile';
import TradesSignup from './pages/TradesSignup';
import TradesSuccess from './pages/TradesSuccess';
import Upgrade from './pages/Upgrade';
import Notifications from './pages/Notifications';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Contractors": Contractors,
    "CreatePost": CreatePost,
    "FindTradesmen": FindTradesmen,
    "Forum": Forum,
    "ForumPost": ForumPost,
    "History": History,
    "Home": Home,
    "IssueDetail": IssueDetail,
    "Messages": Messages,
    "Reminders": Reminders,
    "Settings": Settings,
    "Support": Support,
    "TradesBoost": TradesBoost,
    "TradesDashboard": TradesDashboard,
    "TradesPayment": TradesPayment,
    "TradesPending": TradesPending,
    "TradesProfile": TradesProfile,
    "TradesSignup": TradesSignup,
    "TradesSuccess": TradesSuccess,
    "Upgrade": Upgrade,
    "Notifications": Notifications,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};