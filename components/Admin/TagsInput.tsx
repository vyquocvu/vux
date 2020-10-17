import React, { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';

const ReactTags = dynamic(import('react-tag-input'),
{ ssr: false });

const KeyCodes = {
  comma: 188,
  enter: 13,
};


const delimiters = [KeyCodes.comma, KeyCodes.enter];

export default function TagsInput(props: any) {
  const { handleDelete, handleAddition , handleDrag } = props;
  return (
    <div className="tags-input">

    </div>
  )
}