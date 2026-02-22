import { useAuth } from '../../contexts/AuthContext'

const PRODUCT_LABELS = {
  waypoint: 'Waypoint',
  navigator: 'Navigator',
  meridian: 'Meridian',
}

export default function RequireProduct({ product, children }) {
  const { hasProduct } = useAuth()

  if (!hasProduct(product)) {
    return <ProductUpgradePrompt product={product} />
  }

  return children
}

function ProductUpgradePrompt({ product }) {
  const label = PRODUCT_LABELS[product] || product

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {label} is not included in your plan
      </h2>
      <p className="text-gray-500 max-w-md mb-6">
        <span className="font-medium text-blue-600">{label}</span> is a separate product available through Clear Path Education Group.
        Contact us to add it to your district's subscription.
      </p>
      <a
        href="mailto:support@clearpathedgroup.com"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        Contact Us to Upgrade
      </a>
    </div>
  )
}
