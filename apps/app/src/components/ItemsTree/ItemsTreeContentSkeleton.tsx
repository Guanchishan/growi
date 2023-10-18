import React from 'react';

import { Skeleton } from '~/components/Skeleton';

import styles from './ItemsTree.module.scss';

const ItemsTreeContentSkeleton = (): JSX.Element => {

  return (
    <ul className={`grw-pagetree ${styles['grw-pagetree']} list-group py-3`}>
      <Skeleton additionalClass={`${styles['grw-pagetree-item-skeleton-text']} pe-3`} />
      <Skeleton additionalClass={`${styles['grw-pagetree-item-skeleton-text-child']} pe-3`} />
      <Skeleton additionalClass={`${styles['grw-pagetree-item-skeleton-text-child']} pe-3`} />
    </ul>
  );
};

export default ItemsTreeContentSkeleton;
