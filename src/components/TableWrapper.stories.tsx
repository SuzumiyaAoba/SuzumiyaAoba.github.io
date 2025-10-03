import type { Meta, StoryObj } from "@storybook/react";

import { TableWrapper } from "./TableWrapper";

export default {
  title: "Components/TableWrapper",
  component: TableWrapper,
} satisfies Meta<typeof TableWrapper>;

type Story = StoryObj<typeof TableWrapper>;

export const Default: Story = {
  args: {
    children: (
      <>
        <thead>
          <tr>
            <th>ヘッダー1</th>
            <th>ヘッダー2</th>
            <th>ヘッダー3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>セル1</td>
            <td>セル2</td>
            <td>セル3</td>
          </tr>
          <tr>
            <td>セル4</td>
            <td>セル5</td>
            <td>セル6</td>
          </tr>
        </tbody>
      </>
    ),
  },
};

export const WithCaption: Story = {
  args: {
    caption: "テーブルのサンプルキャプション",
    children: (
      <>
        <thead>
          <tr>
            <th>ヘッダー1</th>
            <th>ヘッダー2</th>
            <th>ヘッダー3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>セル1</td>
            <td>セル2</td>
            <td>セル3</td>
          </tr>
          <tr>
            <td>セル4</td>
            <td>セル5</td>
            <td>セル6</td>
          </tr>
        </tbody>
      </>
    ),
  },
};

export const LargeTable: Story = {
  args: {
    children: (
      <>
        <thead>
          <tr>
            {Array.from({ length: 10 }).map((_, i) => (
              <th key={i} className="px-4 py-2 border">
                ヘッダー{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: 10 }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-2 border">
                  セル {rowIndex * 10 + colIndex + 1}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </>
    ),
  },
};

export const CustomStyles: Story = {
  args: {
    className: "bg-blue-50 p-2",
    tableClassName: "bg-white border-collapse",
    caption: "カスタムスタイル適用例",
    children: (
      <>
        <thead className="bg-blue-100">
          <tr>
            <th className="px-4 py-2 border border-blue-200">ヘッダー1</th>
            <th className="px-4 py-2 border border-blue-200">ヘッダー2</th>
            <th className="px-4 py-2 border border-blue-200">ヘッダー3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2 border border-blue-200">セル1</td>
            <td className="px-4 py-2 border border-blue-200">セル2</td>
            <td className="px-4 py-2 border border-blue-200">セル3</td>
          </tr>
          <tr className="bg-blue-50">
            <td className="px-4 py-2 border border-blue-200">セル4</td>
            <td className="px-4 py-2 border border-blue-200">セル5</td>
            <td className="px-4 py-2 border border-blue-200">セル6</td>
          </tr>
        </tbody>
      </>
    ),
  },
};
