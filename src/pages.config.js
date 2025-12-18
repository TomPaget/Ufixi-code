import Contractors from './pages/Contractors';
import History from './pages/History';
import Home from './pages/Home';
import IssueDetail from './pages/IssueDetail';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Upgrade from './pages/Upgrade';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Contractors": Contractors,
    "History": History,
    "Home": Home,
    "IssueDetail": IssueDetail,
    "Reminders": Reminders,
    "Settings": Settings,
    "Upgrade": Upgrade,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};