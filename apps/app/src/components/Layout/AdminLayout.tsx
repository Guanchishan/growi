import React, { ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { AdminNavigation } from '../Admin/Common/AdminNavigation';

import { RawLayout } from './RawLayout';

import styles from './Admin.module.scss';


const PageCreateModal = dynamic(() => import('../PageCreateModal'), { ssr: false });
const SystemVersion = dynamic(() => import('../SystemVersion'), { ssr: false });
const HotkeysManager = dynamic(() => import('../Hotkeys/HotkeysManager'), { ssr: false });


type Props = {
  componentTitle?: string
  children?: ReactNode
}


const AdminLayout = ({
  children, componentTitle,
}: Props): JSX.Element => {

  return (
    <RawLayout>
      <div className={`admin-page ${styles['admin-page']}`}>

        <header className="py-0 container-fluid">
          <h1 className="p-3 fs-2">{componentTitle}</h1>
        </header>
        <div id="main" className="main">
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-3">
                <AdminNavigation />
              </div>
              <div className="col-lg-9">
                {children}
              </div>
            </div>
          </div>
        </div>

        <PageCreateModal />
        <SystemVersion />
      </div>

      <HotkeysManager />

    </RawLayout>
  );
};

export default AdminLayout;
