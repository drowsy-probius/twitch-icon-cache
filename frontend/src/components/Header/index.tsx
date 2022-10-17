import "./style.css";

import { Link } from "react-router-dom";

function Header() {



  return (
    <div>
      <nav>
          <ul>
            <li>
              <Link to={`/`}> 메인 </Link>
            </li>
            <li>
              <Link to={`/dashboard`}> 대시보드 </Link>
            </li>
            <li>
              <Link to={`/list`}> 전체목록 </Link>
            </li>
          </ul>
        </nav>

    </div>
  )
}

export default Header;