import React, { ReactElement } from 'react';
import './index.scss';
import { useDispatch } from 'react-redux';
import Header from '../../components/Header';
import Body from '../../components/Body';

export default function App(): ReactElement {
  const dispatch = useDispatch();

  return (
    <div className="app flex flex-col gap-4">
      <Header />
      <Body />
    </div>
  );
}
