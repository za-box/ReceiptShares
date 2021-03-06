import Avatar from '../avatar/avatar.jsx'
import './header.css';


export default class Header extends React.Component {
    render() {
        let avatarLink = storage.getState().user.avatarUrl || "/no-photo-avatar.svg";
        return (
            <div className='header clearfix'>
                <h1>Receipt Shares</h1>
                <div className="header__user-profile clearfix">
                    <Avatar avatar={avatarLink}/>
                    <div className="header__user-name">
                        {storage.getState().user.name}
                    </div>
                </div>
            </div>
        );
    }
}

