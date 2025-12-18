import Contractors from './pages/Contractors';
import CreatePost from './pages/CreatePost';
import FindTradesmen from './pages/FindTradesmen';
import Forum from './pages/Forum';
import History from './pages/History';
import Home from './pages/Home';
import IssueDetail from './pages/IssueDetail';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Upgrade from './pages/Upgrade';
import ForumPost from './pages/ForumPost';
import TradesSignup from './pages/TradesSignup';
import TradesSuccess from './pages/TradesSuccess';
import TradesPending from './pages/TradesPending';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Contractors": Contractors,
    "CreatePost": CreatePost,
    "FindTradesmen": FindTradesmen,
    "Forum": Forum,
    "History": History,
    "Home": Home,
    "IssueDetail": IssueDetail,
    "Reminders": Reminders,
    "Settings": Settings,
    "Support": Support,
    "Upgrade": Upgrade,
    "ForumPost": ForumPost,
    "TradesSignup": TradesSignup,
    "TradesSuccess": TradesSuccess,
    "TradesPending": TradesPending,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};