"use client";
import Navigation from "./components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              以太坊 DApp 开发教程
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              学习使用 Wagmi、Ethers.js 和 Viem 三种不同方式与以太坊区块链交互
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-semibold text-blue-600 mb-4">Wagmi</h3>
                <p className="text-gray-600 mb-6">
                  使用 React Hooks 的现代化以太坊开发方式，提供简洁的 API 和自动状态管理
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• React Hooks 集成</p>
                  <p>• 自动状态管理</p>
                  <p>• TypeScript 支持</p>
                  <p>• 缓存和错误处理</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-semibold text-green-600 mb-4">Ethers.js</h3>
                <p className="text-gray-600 mb-6">
                  成熟稳定的以太坊 JavaScript 库，提供完整的区块链交互功能
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 成熟的生态系统</p>
                  <p>• 丰富的文档</p>
                  <p>• 灵活的 API</p>
                  <p>• 广泛的社区支持</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-semibold text-purple-600 mb-4">Viem</h3>
                <p className="text-gray-600 mb-6">
                  轻量级、类型安全的以太坊接口，专为现代 TypeScript 应用设计
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• 轻量级设计</p>
                  <p>• 完整的 TypeScript 支持</p>
                  <p>• 模块化架构</p>
                  <p>• 高性能</p>
                </div>
              </div>
            </div>
            
            <div className="mt-16 p-8 bg-white rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                本教程将实现的功能
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">余额查询</h4>
                  <p className="text-sm text-gray-600 mt-2">查询任意地址的 ETH 余额</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📤</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">发送交易</h4>
                  <p className="text-sm text-gray-600 mt-2">发送 ETH 到指定地址</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🪙</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">ERC20 代币</h4>
                  <p className="text-sm text-gray-600 mt-2">查询代币合约信息和余额</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">👂</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">事件监听</h4>
                  <p className="text-sm text-gray-600 mt-2">实时监听 Transfer 事件</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
