import { TreeItem } from '../tree'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  Button,
  message,
  Typography,
  Space,
  Checkbox,
  Collapse,
  Tooltip
} from 'antd'
import { useEffect, useState } from 'react'
import { useRequest } from 'ahooks'
import apis from '../../../../apis'

const { Panel } = Collapse

const TimeTypeOptions = [
  { label: '无时间限制', value: 1 },
  { label: '大于开始时间', value: 5 },
  { label: '小于结束时间', value: 6 },
  { label: '在开始时间与结束时间之内', value: 7 }
]

const debugInverseOptions = [
  {
    label: 'true',
    value: true
  },
  {
    label: 'false',
    value: false
  }
]

interface Props {
  selectedNode: TreeItem | undefined
  address: string
  app: string
  iceId: string
  refresh: () => void
}

const FieldItem = ({ item }: { item: FieldItem }) => {
  return (
    <div className='filed-item'>
      <div className='desc-item'>名称：{item.name}</div>
      <div className='desc-item'>描述：{item.desc}</div>
      <div className='desc-item'>字段：{item.field}</div>
      <div className='desc-item'>
        <Tooltip title={item.type}>类型：{item.type}</Tooltip>
      </div>
      <Space>
        <Form.Item label='值' name={['fields', item.field, 'value']}>
          <Input />
        </Form.Item>
        <Form.Item
          name={['fields', item.field, 'isNull']}
          valuePropName='checked'
          initialValue={item.valueNull}
        >
          <Checkbox>null</Checkbox>
        </Form.Item>
      </Space>
    </div>
  )
}

const Edit = ({ selectedNode, address, app, iceId, refresh }: Props) => {
  const [isEdit, setIsEdit] = useState(false)
  const [form] = Form.useForm()

  const { run, loading } = useRequest(
    (params: object) => apis.editConf(params),
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res?.ret === 0) {
          setIsEdit(false)
          refresh()
        } else {
          message.error(res?.msg || 'failed')
        }
      },
      onError: (err: any) => {
        message.error(err.msg || 'server error')
      }
    }
  )

  useEffect(() => {
    setFormFields()
  }, [selectedNode])

  const setFormFields = () => {
    let fields: {
      [key: string]: {
        value: string | undefined
        isNull: boolean | undefined
      }
    } = {}
    try {
      const fieldsObj = JSON.parse(selectedNode?.showConf?.confField || '{}')
      Object.keys(fieldsObj).forEach((key) => {
        fields[key] = {
          value: fieldsObj[key] === null ? '' : fieldsObj[key],
          isNull: fieldsObj[key] === null
        }
      })
    } catch (err) {
      console.log(err)
    }
    form.setFieldsValue({
      name: selectedNode?.showConf?.nodeName,
      timeType: selectedNode?.timeType || 1,
      start: selectedNode?.start,
      end: selectedNode?.end,
      debug: selectedNode?.showConf?.debug ?? true,
      inverse: selectedNode?.showConf?.inverse ?? false,
      confField: selectedNode?.showConf?.confField,
      fields
    })
  }

  const confirmEdit = () => {
    form
      .validateFields()
      .then((values) => {
        const fieldsObj: { [key: string]: any } = {}
        Object.entries<{
          value: string | undefined
          isNull: boolean | undefined
        }>(values.fields || {}).forEach((item) => {
          if (!!item[1].value || !!item[1].isNull) {
            fieldsObj[item[0]] = item[1].isNull ? null : item[1].value
          }
        })
        const params = {
          app,
          iceId,
          editType: 2,
          selectId: selectedNode?.showConf?.nodeId,
          parentId: selectedNode?.parentId,
          nextId: selectedNode?.nextId,
          ...selectedNode?.showConf,
          ...values,
          confName: undefined,
          confField: JSON.stringify(fieldsObj)
        }
        run(params)
      })
      .catch(() => {})
  }

  return (
    <div className='edit-wrap'>
      <Form
        className='form-wrap'
        form={form}
        disabled={(!!address && address !== 'server') || !isEdit}
      >
        <Form.Item label='名称' name='name'>
          <Input />
        </Form.Item>
        <Form.Item label='节点名称'>
          {selectedNode?.showConf?.nodeInfo?.name}
        </Form.Item>
        <Form.Item label='节点描述'>
          {selectedNode?.showConf?.nodeInfo?.desc}
        </Form.Item>
        {/* TODO */}
        <Form.Item label='节点类'>
          {selectedNode?.showConf?.confName}
          {/* {!selectedNode?.isRoot && (
            <Button type='primary' size='small' style={{ marginLeft: 5 }}>
              编辑
            </Button>
          )} */}
        </Form.Item>
        <Form.Item label='节点ID'>
          {selectedNode?.showConf?.nodeId}
          {/* {!selectedNode?.isRoot && (
            <Button type='primary' size='small' style={{ marginLeft: 5 }}>
              编辑
            </Button>
          )} */}
        </Form.Item>
        <Form.Item label='时间类型' name='timeType' required>
          <Select options={TimeTypeOptions} />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.timeType !== currentValues.timeType
          }
        >
          {() => (
            <>
              <Form.Item
                label='开始时间'
                name='start'
                dependencies={['timeType']}
                rules={[
                  {
                    required: [2, 5, 5, 7].includes(
                      form.getFieldValue('timeType')
                    ),
                    validator: (rule, value) =>
                      value || !rule.required
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择开始时间'))
                  }
                ]}
              >
                <DatePicker showTime format={'YYYY-MM-DD HH:mm:ss'} />
              </Form.Item>
              <Form.Item
                label='结束时间'
                name='end'
                dependencies={['timeType']}
                rules={[
                  {
                    required: [3, 4, 6, 7].includes(
                      form.getFieldValue('timeType')
                    ),
                    validator: (rule, value) =>
                      value || !rule.required
                        ? Promise.resolve()
                        : Promise.reject(new Error('请选择结束时间'))
                  }
                ]}
              >
                <DatePicker showTime format={'YYYY-MM-DD HH:mm:ss'} />
              </Form.Item>
            </>
          )}
        </Form.Item>
        <Form.Item label='debug' name='debug'>
          <Radio.Group options={debugInverseOptions} />
        </Form.Item>
        <Form.Item label='反转' name='inverse'>
          <Radio.Group options={debugInverseOptions} />
        </Form.Item>
        {!selectedNode?.showConf?.haveClientMeta ? (
          <Form.Item label='配置Json' name='confField'>
            <Input.TextArea rows={8} />
          </Form.Item>
        ) : (
          <>
            <Typography.Title level={4}>属性配置</Typography.Title>
            {(selectedNode?.showConf?.nodeInfo?.iceFields || []).map(
              (item, i) => (
                <FieldItem item={item} key={i} />
              )
            )}
            <Collapse>
              <Panel header='hideFields' key='1' forceRender>
                {(selectedNode?.showConf?.nodeInfo?.hideFields || []).map(
                  (item, i) => (
                    <FieldItem item={item} key={i} />
                  )
                )}
              </Panel>
            </Collapse>
          </>
        )}
      </Form>
      <div className='btn-wrap'>
        {isEdit ? (
          <>
            <Button
              type='primary'
              onClick={() => {
                setIsEdit(false)
              }}
            >
              取消
            </Button>
            <Button
              type='primary'
              style={{ marginLeft: 15 }}
              loading={loading}
              onClick={confirmEdit}
            >
              保存
            </Button>
          </>
        ) : (
          <Button
            type='primary'
            onClick={() => {
              setIsEdit(true)
            }}
            disabled={!!address && address !== 'server'}
          >
            编辑
          </Button>
        )}
      </div>
    </div>
  )
}

export default Edit
