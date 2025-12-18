import Home from './pages/Home';
import IssueDetail from './pages/IssueDetail';
import History from './pages/History';
import Settings from './pages/Settings';
import Upgrade from './pages/Upgrade';
import Contractors from './pages/Contractors';
import Reminders from './pages/Reminders';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "IssueDetail": IssueDetail,
    "History": History,
    "Settings": Settings,
    "Upgrade": Upgrade,
    "Contractors": Contractors,
    "Reminders": Reminders,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};